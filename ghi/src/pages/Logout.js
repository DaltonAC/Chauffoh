import useToken from "@galvanize-inc/jwtdown-for-react";
import { useEffect, useContext, useCallback } from "react";
import { UserContext } from "../components/UserContext.js";

const Logout = () => {
  const { logout } = useToken();
  const { setUserData } = useContext(UserContext);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setUserData(null);
    logout();
  }, [logout, setUserData]);

  useEffect(() => {
    handleLogout();
  }, [handleLogout]);

  return (
      <div className="row">
        <p className="text-danger">
          You have been successfully logged out.
        </p>
      </div>
  );
};

export default Logout;
