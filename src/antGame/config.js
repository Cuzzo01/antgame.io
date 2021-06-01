export const Config = {
  vUnderscan: 100,
  hUnderscan: 10,
  borderWeight: 4,
  // // Deploy
  MapBounds: [200, 112],
  debug: false,
  gridSpacing: 10,
  AntSize: 10,
  TrailDiameter: 3,
  ViewDistance: 2,
  TrailDropRate: 5,
  AntsToSpawn: 1000,
  // // Debug
  // ViewDistance: 30,
  // MapBounds: [30, 16],
  // debug: true,
  // gridSpacing: 25,
  // AntSize: 35,
  // TrailDiameter: 10,
  // TrailDropRate: 15,
  // AntsToSpawn: 4,
  // //////
  TrailDecayInterval: 20,
  AlphaPerDecay: 50,
  gridWeight: 1,
  ViewAngle: 45,
  AntStepDistance: 0.3,
  AntWanderChance: 0.2,
  AntWanderAmount: 30,
  MaxSmellTurnRate: 55,
  MinSmellTurnRate: 20,
  FoodPerCell: 20,
  BackgroundColor: "#909497",
  StayOnCourseWanderAmount: 25,
  FrameRate: 50,
  PercentFoodReturnedToStopTime: 0.99,
  TrailDecayRange: 300,
  TrailTransparencyFloor: 0.005,
  PreloadMap: true,
  BlockDecaySteps: 10,
  MinDecayableAlpha: 50,
  brushTypeDefaultIndex: 1,
  DirtPerCell: 50,
  brushes: [
    {
      value: "w",
      name: "Wall",
      color: "black",
    },
    {
      value: "h",
      name: "Home",
      color: "#C0392B",
    },
    {
      value: "f",
      name: "Food",
      color: "#186A3B",
      decayable: true,
    },
    {
      value: "d",
      name: "Dirt",
      color: "#40260F",
      decayable: true,
    },
    {
      value: " ",
      name: "Eraser",
    },
  ],
  brushSizeDefaultIndex: 1,
  brushSizes: [
    {
      value: "1",
      name: "S",
    },
    {
      value: "3",
      name: "M",
    },
    {
      value: "5",
      name: "L",
    },
    {
      value: "7",
      name: "XL",
    },
  ],
  DefaultPreload: "index",
  SampleMaps: {
    samplea: "/assets/maps/SampleAV1.0.json",
    sampleb: "/assets/maps/SampleBV1.0.json",
    samplec: "/assets/maps/SampleCV1.0.json",
    index: "/assets/maps/HomeMapV1.0.json",
  },
};
