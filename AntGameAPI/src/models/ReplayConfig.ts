export interface ReplayConfig {
  id: string;
  seconds: number;
  name: string;
  active: boolean;
  mapPath: string;
  prData?: RecordData;
  wrData?: RecordData;
}

interface RecordData {
  locations: number[][];
  amounts: {
    [location: string]: number;
  };
  seed: number;
}
