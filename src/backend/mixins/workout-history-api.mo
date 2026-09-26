import Map "mo:core/Map";
import Types "../types/workout-history";
import WorkoutHistoryLib "../lib/workout-history";

mixin (
  rides : Map.Map<Types.RideId, Types.Ride>,
  state : { var nextId : Nat },
  partialRides : Map.Map<Types.PartialRideId, Types.PartialRide>,
) {
  public func saveRide(req : Types.SaveRideRequest) : async Types.Ride {
    WorkoutHistoryLib.saveRide(rides, state, req);
  };

  public query func listRides() : async [Types.Ride] {
    WorkoutHistoryLib.listRides(rides);
  };

  public func deleteRide(id : Types.RideId) : async Bool {
    WorkoutHistoryLib.deleteRide(rides, id);
  };

  public query func getSummary() : async Types.RideSummary {
    WorkoutHistoryLib.getSummary(rides);
  };

  public query func getStatsByPeriod(startMs : Int, endMs : Int) : async Types.StatsResult {
    WorkoutHistoryLib.getStatsByPeriod(rides, startMs, endMs);
  };

  public query func getRidesByDateRange(startMs : Int, endMs : Int) : async [Types.Ride] {
    WorkoutHistoryLib.getRidesByDateRange(rides, startMs, endMs);
  };

  public func autoSaveRide(req : Types.AutoSaveRideRequest) : async Types.PartialRide {
    WorkoutHistoryLib.autoSaveRide(partialRides, req);
  };

  public query func getPartialRide(dayStartMs : Int, dayEndMs : Int) : async ?Types.PartialRide {
    WorkoutHistoryLib.getPartialRide(partialRides, dayStartMs, dayEndMs);
  };

  public func clearPartialRide(dayStartMs : Int, dayEndMs : Int) : async Bool {
    WorkoutHistoryLib.clearPartialRide(partialRides, dayStartMs, dayEndMs);
  };
};
