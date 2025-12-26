import React, { useEffect, useState } from "react";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import Dashboard from "@uppy/react/dashboard";

import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";

export default function FileUploader({ endpoint }) {
  const [uppy, setUppy] = useState(null);

  useEffect(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles: 10,
        allowedFileTypes: ["video/*"],
      },
      autoProceed: false,
    }).use(Tus, {
      endpoint: endpoint || `${import.meta.env.VITE_API_BASE_URL || "/api"}/tus`,
      retryDelays: [0, 1000, 3000, 5000],
    });

    setUppy(uppyInstance);

    return () => {
      uppyInstance.destroy();
    };
  }, [endpoint]);

  if (!uppy) return null;

  return (
    <div className="w-full relative z-0">
      <Dashboard
        uppy={uppy}
        width="100%"
        height="500px"
        showProgressDetails={true}
        proudlyDisplayPoweredByUppy={false}
        theme="light" // or "auto"
      />
    </div>
  );
}
