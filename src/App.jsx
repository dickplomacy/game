import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import DipMap from "./DipMap";

function App() {
  const [title, setTitle] = useState("loading...");
  const [lastClicked, setLastClicked] = useState(null);
  const [hovering, setHovering] = useState(null);

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
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      background: '#fff',
      padding: '1rem',
    }}>
      <h1 style={{ margin: '0 0 0.5rem', fontSize: '2.25rem', letterSpacing: '0.02em' }}>
        {title}
      </h1>
      <p style={{ margin: '0 0 1rem', color: '#555', minHeight: '1.5em' }}>
        {hovering ? `Hovering: ${hovering}` : lastClicked ? `Clicked: ${lastClicked}` : 'Click a territory'}
      </p>
      <div style={{ width: '100%', maxWidth: '960px' }}>
        <DipMap
          onTerritoryClick={setLastClicked}
          onTerritoryHover={setHovering}
        />
      </div>
    </div>
  );
}

export default App;
