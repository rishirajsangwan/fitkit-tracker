import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Types "../types/workout-history";
import Debug "mo:core/Debug";

module {
  public func saveRide(
    rides : Map.Map<Types.RideId, Types.Ride>,
    state : { var nextId : Nat },
    req : Types.SaveRideRequest,
  ) : Types.Ride {
    let id = state.nextId;
    state.nextId += 1;
    let ride : Types.Ride = {
      id;
      date = Time.now();
      durationSeconds = req.durationSeconds;
      distanceMeters = req.distanceMeters;
      calories = req.calories;
      avgSpeedKph = req.avgSpeedKph;
      peakResistance = req.peakResistance;
      minResistance = req.minResistance;
      maxResistance = req.maxResistance;
      avgResistance = req.avgResistance;
      maxHeartRate = req.maxHeartRate;
      avgHeartRate = req.avgHeartRate;
      hydrationLogged = req.hydrationLogged;
    };
    rides.add(id, ride);
    ride;
  };

  public func listRides(
    rides : Map.Map<Types.RideId, Types.Ride>
  ) : [Types.Ride] {
    let arr = rides.values().toArray();
    arr.sort(func(a : Types.Ride, b : Types.Ride) : Order.Order {
      Int.compare(b.date, a.date)
    });
  };

  public func deleteRide(
    rides : Map.Map<Types.RideId, Types.Ride>,
    id : Types.RideId,
  ) : Bool {
    switch (rides.get(id)) {
      case null false;
      case (?_) { rides.remove(id); true };
    };
  };

  public func getSummary(
    rides : Map.Map<Types.RideId, Types.Ride>
  ) : Types.RideSummary {
    var totalDist : Float = 0.0;
    var totalCal : Float = 0.0;
    var totalDurSec : Nat = 0;
    for (ride in rides.values()) {
      totalDist += ride.distanceMeters;
      totalCal += ride.calories;
      totalDurSec += ride.durationSeconds;
    };
    let totalRides = rides.size();
    {
      totalRides;
      totalDistanceMeters = totalDist;
      totalCalories = totalCal;
      totalDistance = totalDist / 1000.0;
      totalCaloriesNat = totalCal.toInt().toNat();
      totalDurationSeconds = totalDurSec;
    };
  };

  public func getStatsByPeriod(
    rides : Map.Map<Types.RideId, Types.Ride>,
    startMs : Int,
    endMs : Int,
  ) : Types.StatsResult {
    let filtered = getRidesByDateRange(rides, startMs, endMs);
    let totalRides = filtered.size();
    var totalDistMeters : Float = 0.0;
    var totalCal : Float = 0.0;
    var totalDurSec : Nat = 0;
    var speedSum : Float = 0.0;
    var hrMax : ?Nat = null;
    var hrSum : Nat = 0;
    var hrCount : Nat = 0;
    var totalHydration : Nat = 0;
    for (r in filtered.values()) {
      totalDistMeters += r.distanceMeters;
      totalCal += r.calories;
      totalDurSec += r.durationSeconds;
      speedSum += r.avgSpeedKph;
      switch (r.maxHeartRate) {
        case null {};
        case (?hr) {
          hrMax := switch (hrMax) {
            case null ?hr;
            case (?prev) if (hr > prev) ?hr else hrMax;
          };
        };
      };
      switch (r.avgHeartRate) {
        case null {};
        case (?hr) { hrSum += hr; hrCount += 1 };
      };
      switch (r.hydrationLogged) {
        case null {};
        case (?ml) { totalHydration += ml };
      };
    };
    let avgSpeed : Float = if (totalRides == 0) 0.0 else speedSum / totalRides.toFloat();
    let avgHR : ?Nat = if (hrCount == 0) null else ?(hrSum / hrCount);
    {
      rides = filtered;
      totalRides;
      totalDistance = totalDistMeters / 1000.0;
      totalCalories = totalCal.toInt().toNat();
      totalDurationSeconds = totalDurSec;
      avgSpeed;
      maxHeartRate = hrMax;
      avgHeartRate = avgHR;
      totalHydration;
    };
  };

  public func getRidesByDateRange(
    rides : Map.Map<Types.RideId, Types.Ride>,
    startMs : Int,
    endMs : Int,
  ) : [Types.Ride] {
    let filtered = rides.values().filter(func(r : Types.Ride) : Bool {
      r.date >= startMs and r.date <= endMs
    }).toArray();
    filtered.sort(func(a : Types.Ride, b : Types.Ride) : Order.Order {
      Int.compare(b.date, a.date)
    });
  };

  public func autoSaveRide(
    partialRides : Map.Map<Types.PartialRideId, Types.PartialRide>,
    req : Types.AutoSaveRideRequest,
  ) : Types.PartialRide {
    let partial : Types.PartialRide = {
      id = req.id;
      startTimestamp = req.startTimestamp;
      lastSavedAt = Time.now();
      elapsedSeconds = req.elapsedSeconds;
      distanceKm = req.distanceKm;
      calories = req.calories;
      avgSpeed = req.avgSpeed;
      avgCadence = req.avgCadence;
      avgResistance = req.avgResistance;
      avgHeartRate = req.avgHeartRate;
      isPartial = true;
    };
    partialRides.add(req.id, partial);
    partial;
  };

  public func getPartialRide(
    partialRides : Map.Map<Types.PartialRideId, Types.PartialRide>,
    dayStartMs : Int,
    dayEndMs : Int,
  ) : ?Types.PartialRide {
    for ((key, partial) in partialRides.entries()) {
      if (partial.startTimestamp >= dayStartMs and partial.startTimestamp <= dayEndMs and partial.isPartial) {
        return ?partial;
      };
    };
    null;
  };

  public func clearPartialRide(
    partialRides : Map.Map<Types.PartialRideId, Types.PartialRide>,
    dayStartMs : Int,
    dayEndMs : Int,
  ) : Bool {
    var removed = false;
    let keysToRemove = partialRides.entries().toArray().filter(
      func((_, partial) : (Types.PartialRideId, Types.PartialRide)) : Bool {
        partial.startTimestamp >= dayStartMs and partial.startTimestamp <= dayEndMs and partial.isPartial;
      },
    );
    for ((key, _) in keysToRemove.values()) {
      partialRides.remove(key);
      removed := true;
    };
    removed;
  };
};
