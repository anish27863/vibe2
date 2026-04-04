/**
 * TypeScript type definitions for SmartRoute.
 * Updated for ORS + Nominatim stack (no Google Maps types).
 */

// ─── Travel Mode ─────────────────────────────────────────────────────────────

export type TravelMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
export type VehicleType = 'car' | 'bike' | 'motorcycle' | 'walking' | 'transit';

// ─── Route Preferences ────────────────────────────────────────────────────────

export interface RoutePreferences {
  avoidTraffic:           boolean;
  preferShortestTime:     boolean;
  preferShortestDistance: boolean;
  bikeFriendly:           boolean;
  avoidHighways:          boolean;
  avoidTolls:             boolean;
  vehicleType:            VehicleType;
  travelMode:             TravelMode;
}

// ─── Map Primitives ───────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Place search result from Nominatim.
 * coords are embedded so no extra geocoding API call is needed.
 */
export interface PlaceResult {
  placeId:       string;
  description:   string;
  mainText:      string;
  secondaryText: string;
  coords?:       LatLng; // always present from Nominatim
}

// ─── Route Types ──────────────────────────────────────────────────────────────

export interface RouteStep {
  distance:         number;  // metres
  duration:         number;  // seconds
  htmlInstructions: string;
  travelMode:       string;
}

export type RoadType = 'highway' | 'arterial' | 'local' | 'bike_path' | 'unknown';

export interface RouteLeg {
  distance:          number;
  duration:          number;
  durationInTraffic: number; // simulated (ORS has no real-time traffic)
  startAddress:      string;
  endAddress:        string;
  steps:             RouteStep[];
}

export interface RoadTypeDistribution {
  highwayPercent:  number;
  arterialPercent: number;
  localPercent:    number;
  bikePathPercent: number;
}

export type TrafficLevel = 'low' | 'moderate' | 'high' | 'very_high';

export type RouteLabel =
  | 'Fastest'
  | 'Less Traffic'
  | 'Shortest'
  | 'Bike Optimized'
  | 'Eco Friendly'
  | 'Recommended';

export interface SmartRouteOption {
  id:               string;
  index:            number;
  summary:          string;
  legs:             RouteLeg[];
  overviewPolyline: string;
  bounds: {
    northeast: LatLng;
    southwest: LatLng;
  };
  warnings:               string[];
  totalDistance:          number; // metres
  totalDuration:          number; // seconds (free-flow)
  totalDurationInTraffic: number; // seconds (simulated traffic)
  roadTypeDistribution:   RoadTypeDistribution; // from ORS extras.waytype
  trafficLevel:           TrafficLevel;         // computed from duration ratio
  score:                  number;
  label:                  RouteLabel;
  scoreBreakdown: {
    timeScore:     number;
    trafficScore:  number;
    distanceScore: number;
    roadTypeScore: number;
  };
  color: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface DirectionsApiResponse {
  routes: SmartRouteOption[];
  status: 'OK' | 'ZERO_RESULTS' | 'ERROR';
  error?: string;
}

export interface PlacesAutocompleteResponse {
  predictions: PlaceResult[];
  status:      string;
}

// ─── Database Types ───────────────────────────────────────────────────────────

export interface UserPreferences {
  id:                      string;
  userId:                  string;
  vehicleType:             VehicleType;
  travelMode:              TravelMode;
  avoidTraffic:            boolean;
  preferShortestTime:      boolean;
  preferShortestDistance:  boolean;
  bikeFriendly:            boolean;
  avoidHighways:           boolean;
  avoidTolls:              boolean;
  darkMode:                boolean;
  createdAt:               string;
  updatedAt:               string;
}

export interface SavedRoute {
  id:                string;
  userId:            string;
  name:              string;
  origin:            string;
  destination:       string;
  originCoords:      LatLng;
  destinationCoords: LatLng;
  routeData:         SmartRouteOption;
  preferences:       RoutePreferences;
  createdAt:         string;
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface SearchState {
  origin:            string;
  destination:       string;
  originCoords:      LatLng | null;
  destinationCoords: LatLng | null;
}
