import Time "mo:core/Time";
import Debug "mo:core/Debug";

module {
  public type RideId = Nat;

  public type Ride = {
    id : RideId;
    date : Time.Time;
    durationSeconds : Nat;
    distanceMeters : Float;
    calories : Float;
    avgSpeedKph : Float;
    peakResistance : Nat;
    minResistance : Nat;
    maxResistance : Nat;
    avgResistance : Float;
    maxHeartRate : ?Nat;
    avgHeartRate : ?Nat;
    hydrationLogged : ?Nat;
  };

  public type RideSummary = {
    totalRides : Nat;
    totalDistanceMeters : Float;
    totalCalories : Float;
    totalDistance : Float;
    totalCaloriesNat : Nat;
    totalDurationSeconds : Nat;
  };

  public type StatsResult = {
    rides : [Ride];
    totalRides : Nat;
    totalDistance : Float;
    totalCalories : Nat;
    totalDurationSeconds : Nat;
    avgSpeed : Float;
    maxHeartRate : ?Nat;
    avgHeartRate : ?Nat;
    totalHydration : Nat;
  };

  public type SaveRideRequest = {
    durationSeconds : Nat;
    distanceMeters : Float;
    calories : Float;
    avgSpeedKph : Float;
    peakResistance : Nat;
    minResistance : Nat;
    maxResistance : Nat;
    avgResistance : Float;
    maxHeartRate : ?Nat;
    avgHeartRate : ?Nat;
    hydrationLogged : ?Nat;
  };

  public type PartialRideId = Text;

  public type PartialRide = {
    id : PartialRideId;
    startTimestamp : Int;
    lastSavedAt : Int;
    elapsedSeconds : Nat;
    distanceKm : Float;
    calories : Nat;
    avgSpeed : Float;
    avgCadence : Nat;
    avgResistance : Nat;
    avgHeartRate : Nat;
    isPartial : Bool;
  };

  public type AutoSaveRideRequest = {
    id : PartialRideId;
    startTimestamp : Int;
    elapsedSeconds : Nat;
    distanceKm : Float;
    calories : Nat;
    avgSpeed : Float;
    avgCadence : Nat;
    avgResistance : Nat;
    avgHeartRate : Nat;
  };
};
