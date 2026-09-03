import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/schemes')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch schemes');
        }
        return res.json();
      })
      .then((data) => {
        setSchemes(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>SchemeSaathi</h1>
      <p>Your welfare scheme recommendation platform</p>

      <h2>Available Schemes</h2>
      {loading && <p>Loading schemes...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <ul>
        {schemes.map((scheme) => (
          <li key={scheme.id} style={{ marginBottom: '1.5rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
            <h3>{scheme.name}</h3>
            <p><strong>Category:</strong> {scheme.category}</p>
            <p><strong>Beneficiary:</strong> {scheme.beneficiary}</p>
            <p>{scheme.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;