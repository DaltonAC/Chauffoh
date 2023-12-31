import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../components/UserContext.js";
import { Steps } from "antd";
import Map from "../components/Map.js";

const CurrentRides = ({ userData }) => {
  const [rides, setRides] = useState([]);
  const { setUserData } = useContext(UserContext);

  const [startloc, setStartloc] = useState([]);
  const [endloc, setEndloc] = useState([]);

  const navigate = useNavigate();
  const items = [
    {
      title: "Requested",
    },
    {
      title: "In Progress",
    },
    {
      title: "Complete",
    },
  ];
  const loadRides = useCallback(async () => {
    const url = `${process.env.REACT_APP_USER_SERVICE_API_HOST}/api/rides/history/${userData.id}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.log("error with fetch");
    } else {
      const data = await response.json();
      const filterRides = data.filter(
        (ride) =>
          ride.ride_status === "Requested" || ride.ride_status === "In Progress"
      );
      setRides(filterRides);
    }
  }, [userData.id]);

  const loadOneRide = (ride_id) => async () => {
    navigate(`/dashboard/account/rides/${ride_id}`);
  };

  const updateStatus = (ride_id, ride) => async () => {
    try {
      const url = `${process.env.REACT_APP_USER_SERVICE_API_HOST}/api/rides/set_status/${ride_id}`;
      const response = await fetch(url, {
        method: "PATCH",
        body: JSON.stringify({ ride_status: "Cancelled" }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const urlUser = `${process.env.REACT_APP_USER_SERVICE_API_HOST}/api/accounts/${userData.username}`;
      const userResponse = await fetch(urlUser, {
        method: "PATCH",
        body: JSON.stringify({
          current_ride: false,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      setUserData({
        ...userData,
        current_ride: false,
      });
      localStorage.setItem(
        "userData",
        JSON.stringify({
          ...userData,
          current_ride: false,
        })
      );

      if (response.ok && userResponse.ok) {
        loadRides();
      } else {
        console.log("Can not update ride status");
      }
    } catch (e) {
      console.log("Error on update", e);
    }
  };

  useEffect(() => {
    loadRides();
  }, [loadRides]);


  const getStartlocation = async(start) => {
    if (start) {
    const start_url = start.replace(/ /g, '+')
    const url=`https://geocode.maps.co/search?q=${start_url}`
    const response = await fetch(url)

    if (!response.ok){
        console.log('error with fetch')
    } else {
        const data = await response.json()
        const location = [parseFloat(data[0].lat),parseFloat(data[0].lon)]
        setStartloc(location)
    }
    }
  }
  const getEndlocation = async(end) => {
    if (end){
    const end_url = end.replace(/ /g, '+')
    const url=`https://geocode.maps.co/search?q=${end_url}`
    const response = await fetch(url)

    if (!response.ok){
        console.log('error with fetch')
    } else {
        const data = await response.json()

        const location = [parseFloat(data[0].lat),parseFloat(data[0].lon)]

        setEndloc(location)
    }
    }
  }
  useEffect(() => {
    if (rides[0]){
    getStartlocation(rides[0].start_location);
    getEndlocation(rides[0].end_location);
    }
  }, [rides]);

  if (!rides && !startloc && !endloc){
    return null;
  } else {
  return (
    <div className="container-fluid data-table">
      {rides.length > 0 ? (
        <>
          {rides.map((ride) => {
            if (
              ride.ride_status === "Requested" ||
              ride.ride_status === "requested" ||
              ride.ride_status === "In Progress"
            ) {
              const step = ride.ride_status === "Requested" ? 0 : 1;
              return (
                <div key={ride.id} className="">
                  <div className="d-flex flex-row">
                    <h2>Current Ride ID {ride.id}</h2>
                  </div>
                  <div className="row">
                    <div className="col">
                      <>
                        <Steps
                          current={step}
                          labelPlacement="vertical"
                          items={items}
                        />
                      </>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col">
                      <div className="grid-label">
                        Start Location:{" "}
                        <span className="grid-value">
                          {ride.start_location}
                        </span>
                        <div className="grid-label">
                          End location:{" "}
                          <span className="grid-value">
                            {ride.end_location}
                          </span>
                        </div>
                        <div className="grid-label">
                          Vehicle:{" "}
                          <span className="grid-value">
                            {ride.vehicle_info}
                          </span>
                        </div>
                        <div className="grid-label">
                          Notes:{" "}
                          <span className="grid-value">{ride.comments}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col">
                      <div className="grid-label">
                        Requested on {""}
                        <span>
                          {new Date(ride.datetime).toLocaleString("en-US", {
                            month: "numeric",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          })}
                        </span>
                      </div>
                      <div className="grid-label">
                        Driver:{" "}
                        <span className="grid-value">
                          {ride.driver.first_name} {ride.driver.last_name}
                        </span>
                      </div>
                      <div className="grid-label">
                        Roundtrip:{" "}
                        <span className="grid-value">
                          {ride.is_roundtrip ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    {!(
                      ride.ride_status === "In Progress" ||
                      ride.ride_status === "Completed" ||
                      ride.ride_status === "Cancelled"
                    ) ? (
                      <>
                        <button
                          type="button"
                          onClick={updateStatus(ride.id, ride)}
                          className="btn btn-outline-danger"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={loadOneRide(ride.id)}
                        className="button-primary"
                      >
                        View
                      </button>
                    )}
                  </div>
        <Map start={startloc} end={endloc} />
                </div>
              );
            } else {
              return (
                <>
                  <div>
                    <h7>
                      No current ride, click 'Request a Ride' from the sidebar.
                    </h7>
                  </div>
                </>
              );
            }
          })}
        </>
      ) : (
        <>
          <div>
            <h6>
              You do not have any current rides. 
              <br></br>
              To create a ride, click the 'Request a Ride' button on the sidebar. 
              <br></br>
              This section will then display your requested ride information.
            </h6>
          </div>
        </>
      )}
    </div>
  );
};
}
export default CurrentRides;
