import { Toaster } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#0f172a",
          color: "#fff",
          borderRadius: "10px",
          padding: "12px 16px",
        },
        success: {
          iconTheme: {
            primary: "green",
            secondary: "white",
          },
        },
        error: {
          iconTheme: {
            primary: "red",
            secondary: "white",
          },
        },
      }}
    />
  );
}