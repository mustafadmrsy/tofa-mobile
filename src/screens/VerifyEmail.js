import React, { useState } from "react";
import { View, Text } from "react-native";
import { Button, Snackbar } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import AuthContainer from "../components/AuthContainer";
import { auth } from "../api/firebaseConfig";
import { db } from "../api/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

export default function VerifyEmail() {
  const { resendVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigation = useNavigation();

  const handleResend = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await resendVerification();
      setSuccess("Doğrulama e-postası tekrar gönderildi.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      if (auth && auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          try { await auth.currentUser.getIdToken(true); } catch {}
          try {
            if (db) {
              await setDoc(doc(db, "users", auth.currentUser.uid), { verified: 1, verifiedAt: serverTimestamp() }, { merge: true });
            }
          } catch {}
          setSuccess("E-posta doğrulandı. Girişe yönlendiriliyorsunuz...");
          setTimeout(() => {
            try { navigation.navigate("Login"); } catch {}
          }, 800);
        } else {
          setError("Henüz doğrulanmadı. Lütfen e-postanı kontrol et.");
        }
      } else {
        setError("Oturum bulunamadı.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>E-postanı Doğrula</Text>
        <Text style={{ color: '#9aa0a6', marginTop: 8, textAlign: 'center' }}>
          Kayıt işlemini tamamlamak için e-postana gönderdiğimiz bağlantıyı onayla.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <Button mode="contained" onPress={handleResend} loading={loading} disabled={loading}>
          Doğrulama E-postasını Yeniden Gönder
        </Button>
        <Button mode="outlined" onPress={handleCheckVerified} disabled={loading}>
          Onayladım, Yeniden Kontrol Et
        </Button>
      </View>

      <Snackbar visible={!!error} onDismiss={() => setError("")} duration={4000} style={{ backgroundColor: '#ef4444' }}>
        {error}
      </Snackbar>
      <Snackbar visible={!!success} onDismiss={() => setSuccess("")} duration={4000} style={{ backgroundColor: '#22c55e' }}>
        {success}
      </Snackbar>
    </AuthContainer>
  );
}
