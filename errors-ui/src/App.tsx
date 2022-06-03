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

interface ReportDetail {
  name: string;
  error?: string;
  message?: string;
  stack: string;
}

function App() {
  const [list, setList] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportDetail, setReportDetail] = useState<ReportDetail>();

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

      const list: ListResponse = await response.json();
      if (!Array.isArray(list.reports)) {
        setError("No reports available");
        return;
      }
      setList(list.reports);
    };

    setLoading(true);
    fetchList().then(() => setLoading(false));
  }, []);

  const fetchReport = async (key: string) => {
    setLoading(true);
    const response = await fetch(`${api}/errors/${key}`);
    setLoading(false);

    if (!response.ok) {
      setReportDetail({
        name: key,
        error: `Failed to fetch report (${response.status})`,
        stack: "",
      });
      return;
    }

    const { report }: { report: Omit<ReportDetail, "name"> } =
      await response.json();
    setReportDetail({ ...report, name: key });
  };

  return (
    <div className="App">
      <h2>fediship error reports</h2>
      <p>{loading ? "Loading..." : "💁🏻‍♂️"}</p>
      {error && <p>Error: {error}</p>}
      {list.length > 0 ? (
        <div>
          <p>Showing {list.length} reports</p>
          <div className="row">
            <div className="col">
              <ul>
                {list.map((report) => {
                  const date = new Date(Number(report.name));
                  return (
                    <li
                      key={report.name}
                      className={
                        reportDetail?.name === report.name
                          ? "active"
                          : undefined
                      }
                      onClick={() => fetchReport(report.name)}
                    >
                      {date.toLocaleString()}
                    </li>
                  );
                })}
              </ul>
            </div>
            {reportDetail && (
              <div className="col left">
                <h3>Message</h3>
                <p>
                  {reportDetail.error ?? reportDetail.message ?? "(missing)"}
                </p>
                {reportDetail.stack && (
                  <>
                    <h3>Stack</h3>
                    <p>{reportDetail.stack}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>No reports to show</p>
      )}
    </div>
  );
}

export default App;
