import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

function App() {
  const [title, setTitle] = useState("loading...");

  useEffect(() => {
    getDoc(doc(db, "config", "ui")).then((snap) => {
      if (snap.exists()) setTitle(snap.data().title);
      else setTitle("dickplomacy");
    });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      background: '#fff'
    }}>
      <h1 style={{ margin: '0 0 1rem', fontSize: '2.25rem', letterSpacing: '0.02em' }}>
        {title}
      </h1>
      <img
        src={`${import.meta.env.BASE_URL}dipmap.jpg`} 
        alt="dipmap"
        style={{ maxWidth: '90%', height: 'auto', border: 0 }}
      />
    </div>
  );
}

export default App;
