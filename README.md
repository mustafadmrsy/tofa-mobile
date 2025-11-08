# TOFA Mobile

Role tabanlı görev yönetimi (superadmin, admin/leader, worker) için Firebase (Auth + Firestore + Storage) entegre edilmiş, Expo/React Native ile geliştirilmiş mobil uygulama.

## Özellikler
- Roller: superadmin, admin/leader, worker
- E-posta doğrulama zorunluluğu ve Firestore `users.verified` senkronizasyonu
- Lider/Süper Admin panelleri ve neon temalı modern UI
- Ekip yönetimi: liderin ekibine üye ekleme/çıkarma
- Görev yönetimi: oluşturma, atama, durum güncelleme
- “Tarihi Geçmiş” ve “Yaklaşan” görev bölümleri, ayarlanabilir uyarı eşiği
- Worker: sadece kendisine atanmış görevler

## Kurulum
1. Bağımlılıklar
   ```bash
   npm install
   ```
2. Firebase yapılandırması
   - Aşağıdaki dosyayı kendi Firebase projenize göre doldurun:
     - `src/api/firebaseConfig.js`
   - Örnek içerik:
     ```js
     import { initializeApp } from "firebase/app";
     import { getAuth } from "firebase/auth";
     import { getFirestore } from "firebase/firestore";
     import { getStorage } from "firebase/storage";

     const firebaseConfig = {
       apiKey: "...",
       authDomain: "...",
       projectId: "...",
       storageBucket: "...",
       messagingSenderId: "...",
       appId: "...",
     };

     export const app = initializeApp(firebaseConfig);
     export const auth = getAuth(app);
     export const db = getFirestore(app);
     export const storage = getStorage(app);
     export const isFirebaseConfigured = !!firebaseConfig?.projectId;
     ```
   - Süper admin e-postasını `src/constants/bootstrap.js` içerisine ekleyin:
     ```js
     export const SUPERADMIN_EMAIL = "superadmin@domain.com";
     ```

3. Geliştirme sunucusu
   ```bash
   npx expo start --tunnel
   ```
   - iOS/Android simülatör ya da gerçek cihazda Expo Go ile taratıp çalıştırın.

## Navigasyon
- `src/navigation/AppNavigator.js`: Rol bazlı yönlendirme
- Admin/Lider: `AdminTabs` (AdminDashboard + CreateTask + TeamManagement + Profile)
- Worker: `WorkerStack`/`WorkerTabs`
- Super Admin: `SuperAdminTabs`
- `TaskDetail` hem `task` nesnesi hem de `taskId` ile açılabilir.

## Önemli Ekranlar
- `src/screens/Dashboard/AdminDashboard.js` (Lider Dashboard)
  - Neon banner ve istatistik kartları
  - Son Görevler listesi (detaya navigasyon)
  - Tarihi Geçmiş/Yaklaşan bölümleri, uyarı eşiği
- `src/screens/TeamManagement.js`
  - Ekip üyeleri listesi, üye ekleme modalı (Ekiptekiler/Ekipte olmayanlar sekmeleri)
  - Üye detayı ve atandığı son görevler
- `src/screens/Dashboard/WorkerDashboard.js`
  - Firestore’dan sadece çalışanın görevleri
  - Tarihi Geçmiş/Yaklaşan bölümleri
- `src/screens/CreateTask.js`
  - Takım ve atanan kişi seçimi, dueDate seçici

## Firestore Kuralları
Aşağıdaki kurallar repo ile uyumludur. Liderler lideri oldukları takıma görev oluşturabilir ve sadece o takım üyesine/liderine atayabilir. Worker kendi görevlerini verified olmasa dahi okuyabilir. Users okuma liderlere açık (Üye Ekle için).

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function userDoc(uid) { return get(/databases/$(database)/documents/users/$(uid)); }
    function userData() { return userDoc(request.auth.uid).data; }
    function isVerified() { return isSignedIn() && (userData().verified == 1); }
    function userRole() { return isSignedIn() ? (userData().role != null ? userData().role : "worker") : "worker"; }
    function isSuperAdmin() { return userRole() == "superadmin"; }
    function isAdmin() { return isSuperAdmin() || userRole() == "admin"; }
    function isLeader() { return userRole() == "leader"; }
    function isWorker() { return userRole() == "worker"; }
    function userTeamId() { return isSignedIn() ? userData().teamId : null; }

    function isLeaderOf(teamId) {
      return isLeader() && get(/databases/$(database)/documents/teams/$(teamId)).data.leaderId == request.auth.uid;
    }

    function isMemberOf(teamId, uid) {
      let t = get(/databases/$(database)/documents/teams/$(teamId)).data;
      return (t.leaderId == uid) || (t.memberIds != null && t.memberIds.hasAny([uid]));
    }

    match /users/{uid} {
      allow read: if isSignedIn() && (uid == request.auth.uid || isAdmin() || isLeader());
      allow create: if isSignedIn() && uid == request.auth.uid;
      allow update: if isSignedIn() && uid == request.auth.uid
        && request.resource.data.keys().hasOnly(['name','teamId','verified','verifiedAt'])
        && (
          request.resource.data.diff(resource.data).changedKeys().hasOnly(['name','teamId'])
          || (
            request.resource.data.diff(resource.data).changedKeys().hasOnly(['verified','verifiedAt'])
            && request.resource.data.verified == 1
            && request.auth.token.email_verified == true
          )
        );
      allow delete: if isAdmin();
      allow write: if isAdmin();
    }

    match /teams/{teamId} {
      allow read: if isVerified() && (
        isAdmin() ||
        (isLeader() && resource.data.leaderId == request.auth.uid) ||
        ((userTeamId() == teamId) && (resource.data.memberIds != null && resource.data.memberIds.hasAny([request.auth.uid])))
      );
      allow create: if isVerified() && isAdmin();
      allow update: if isVerified() && (
        isAdmin() ||
        (isLeader() && resource.data.leaderId == request.auth.uid &&
          request.resource.data.keys().hasOnly(['name','leaderId','memberIds','createdAt']) &&
          request.resource.data.leaderId == resource.data.leaderId)
      );
      allow delete: if isVerified() && isAdmin();
    }

    match /tasks/{taskId} {
      allow read: if (
        (isSignedIn() && isWorker() && resource.data.assigneeId == request.auth.uid)
        || (isVerified() && (isAdmin() || (isLeader() && (resource.data.teamId == userTeamId() || isLeaderOf(resource.data.teamId)))))
      );
      allow create: if isVerified() && (
        isAdmin() || (isLeaderOf(request.resource.data.teamId) && isMemberOf(request.resource.data.teamId, request.resource.data.assigneeId))
      );
      allow update: if isVerified() && (
        isAdmin() ||
        (isLeader() && (resource.data.teamId == userTeamId() || isLeaderOf(resource.data.teamId))) ||
        (isWorker() && resource.data.assigneeId == request.auth.uid && request.resource.data.diff(resource.data).changedKeys().hasOnly(['status']))
      );
      allow delete: if isVerified() && (isAdmin() || (isLeader() && (resource.data.teamId == userTeamId() || isLeaderOf(resource.data.teamId))));
    }
  }
}
```

## Çalıştırma
- İlk defa: `npm install`
- Geliştirme: `npx expo start --tunnel`
- Android/iOS cihaz: Expo Go ile QR kodu okutun

## Katkı
- PR açmadan önce lütfen konuyu kısaca bir issue ile not düşün.
- Kod stili: Prettier/Eslint (varsayılan Expo ayarları) + fonksiyonel, küçük bileşenler tercih edilir.

## Lisans
MIT
