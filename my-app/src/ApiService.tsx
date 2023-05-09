import { useState } from 'react';

interface ApiServiceProps {
  datasetId: string;
  query: string;
}

export default function ApiService({ datasetId, query }: ApiServiceProps) {
  const [response, setResponse] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Write datasetId and query to JSON file
    const data = {
      datasetId: datasetId,
      query: query
    };
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `query-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // TODO: Call backend API with datasetId and query
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <button type="submit">Download Query JSON</button>
      </form>
      <div>{response}</div>
    </div>
  );
}
