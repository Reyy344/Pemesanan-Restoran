const Dashbord = () => {
  return (
    <div className="flex justify-center min-h-screen items-center">
      <form action="">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="bg-red-500 p-3 rounded-xl text-white font-bold cursor-pointer hover:bg-red-700 transition"
        >
          Logout
        </button>
      </form>
    </div>
  );
};

export default Dashbord;
