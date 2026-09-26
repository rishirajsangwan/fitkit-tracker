import Map "mo:core/Map";
import Types "types/workout-history";
import WorkoutHistoryApi "mixins/workout-history-api";



actor {
  let rides = Map.empty<Types.RideId, Types.Ride>();
  let state = { var nextId : Nat = 0 };
  let partialRides = Map.empty<Types.PartialRideId, Types.PartialRide>();
  include WorkoutHistoryApi(rides, state, partialRides);
};

