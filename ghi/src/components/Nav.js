import { NavLink } from "react-router-dom";
import useToken from "@galvanize-inc/jwtdown-for-react";

export default function Nav() {
  const { logout } = useToken();

  return (
    <nav>
      <ul>
        <li>
          <NavLink to="/">Home</NavLink>
        </li>
        <li>
          <NavLink to="/signup">Sign Up</NavLink>
        </li>
        <li>
          <NavLink to="/login">Login</NavLink>
        </li>
        <li>
          <NavLink to="/request">Request a Ride</NavLink>
        </li>
        <li>
          <NavLink to="/about">About</NavLink>
        </li>
        <li>
          <button className="btn btn-danger" onClick={logout}>
            Logout <i className="bi bi-box-arrow-left"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
}