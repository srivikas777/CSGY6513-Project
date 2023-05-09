import React, { useState } from "react";
import "./App.css";

interface QueryFormProps {
  onSubmit: (datasetId: string, query: string) => void;
}

interface QueryResult {
  columns: string[];
  rows: Record<string, string>[];
}

export function App({ onSubmit }: QueryFormProps) {
  const [datasetId, setDatasetId] = useState("");
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult>({ columns: [], rows: [] });
  /*
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(datasetId, query);

    const data = {
      datasetId: datasetId,
      query: query
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to query dataset. Response status code: ${response.status}`);
      }

      const responseData = await response.json();
      const result = responseData.result;
      const columns = Object.keys(result[0]);
      const rows = result.map((row: Record<string, string>) => row);

      setQueryResult({ columns, rows });

    } catch (error) {
      console.error(error);
    }
  };
  */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(datasetId, query);

    const data = {
      datasetId: datasetId,
      query: query
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to query dataset. Response status code: ${response.status}`);
      }

      const responseData = await response.json();
      const result = responseData.result;
      const columns = Object.keys(result[0]);

      setQueryResult({ columns: columns, rows: result });

    } catch (error) {
      console.error(error);
    }
  };


  return (
    <div className="container">
      <div className="header">
        <h1>AUCTUS Querying with DataSet ID and SQL Query</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            Dataset ID:
            <input
              type="text"
              className="form-control"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
            />
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">
            SQL Query:
            <textarea
              className="form-control"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="btn btn-primary">
          Submit the Dataset ID and SQL Query that you want to query.
        </button>
      </form>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {queryResult.columns.map((column, index) => (
                <th key={index}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queryResult.rows.map((row, index) => (
              <tr key={index}>
                {queryResult.columns.map((column, index) => (
                  <td key={index}>{row[column]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}




/*
//Working code:
import React, { useState } from "react";
import "./App.css";

interface QueryFormProps {
  onSubmit: (datasetId: string, query: string) => void;
}

export function App({ onSubmit }: QueryFormProps) {
  const [datasetId, setDatasetId] = useState("");
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(datasetId, query);

    const data = {
      datasetId: datasetId,
      query: query
    };

    try {
      //const response = await fetch('http://127.0.0.1:5000/api/download-dataset', {
      const response = await fetch('http://127.0.0.1:5000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to download dataset. Response status code: ${response.status}`);
      }

      // parse the response as JSON
      const responseData = await response.json();

      // update the query result state variable
      setQueryResult(JSON.stringify(responseData));

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>AUCTUS Querying with DataSet ID and SQL Query</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            Dataset ID:
            <input
              type="text"
              className="form-control"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
            />
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">
            SQL Query:
            <textarea
              className="form-control"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="btn btn-primary">
          Submit the Dataset ID and SQL Query that you want to query.
        </button>
      </form>
      <div className="table-container">
        <div className="query-result">
          {queryResult}
        </div>
      </div>
    </div>
  );
}
*/

/*
Old version:
import React, { useState } from "react";
import "./App.css";

interface QueryFormProps {
  onSubmit: (datasetId: string, query: string) => void;
}

export function App({ onSubmit }: QueryFormProps) {
  const [datasetId, setDatasetId] = useState("");
  const [query, setQuery] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(datasetId, query);
  
    const data = {
      datasetId: datasetId,
      query: query
    };
  
    try {
      //const response = await fetch('http://127.0.0.1:5000/api/download-dataset', {
        const response = await fetch('http://127.0.0.1:5000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
  
      if (!response.ok) {
        throw new Error(`Failed to download dataset. Response status code: ${response.status}`);
      }
  
      // parse the response as JSON
      const responseData = await response.json();
  
      // log the response data to the console
      console.log(responseData);
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <div className="container">
      <div className="header">
        <h1>AUCTUS Querying with DataSet ID and SQL Query</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            Dataset ID:
            <input
              type="text"
              className="form-control"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
            />
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">
            SQL Query:
            <textarea
              className="form-control"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>
      <div className="table-container">
      </div>
    </div>
  );
}

*/
