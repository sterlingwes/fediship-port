import React, { useEffect, useState } from "react";
import "./App.css";

const api = process.env.REACT_APP_API_BASE;

interface Report {
  name: string;
}
interface ListResponse {
  reports: Report[];
  more: boolean;
}

function App() {
  const [list, setList] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!api) {
      setError("No api host set");
      return;
    }

    const fetchList = async () => {
      const response = await fetch(`${api}/errors`);
      if (!response.ok) {
        setError("Response not ok");
        return;
      }

      const list = await response.json();
      if (!Array.isArray((list as ListResponse).reports)) {
        setError("No reports available");
        return;
      }
      setList(list.response);
    };

    setLoading(true);
    fetchList().then(() => setLoading(false));
  }, []);

  return (
    <div className="App">
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {list.length > 0 ? (
        <p>Showing {list.length} reports</p>
      ) : (
        <p>No reports to show</p>
      )}
      {list.map((report) => (
        <p>{report.name}</p>
      ))}
    </div>
  );
}

export default App;
