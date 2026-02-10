import { isRouteErrorResponse, useRouteError } from "react-router-dom";

const ErrorPage = () => {
  const error = useRouteError();

  let status = "Oops!";
  let message = "Maaf, sesuatu tidak berjalan dengan baik.";

  if (isRouteErrorResponse(error)) {
    status = String(error.status);
    message = "Not Found, Kocak lu bang";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-500 to-indigo-600 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
        {/* Icons */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title  */}
        <h1 className="text-6xl font-bold text-red-500 mb-2">
          {status || "Oops!"}
        </h1>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Ada yang salah tuh bang!
        </h1>

        {/* Description  */}
        <p className="text-gray-500 mb-6">{message}</p>
      </div>
    </div>
  );
};

export default ErrorPage;
