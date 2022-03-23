# AntGame.io

[AntGame.io](htps://antgame.io) is puzzle web game built around an ant simulator. 

## Description

AntGame is a full stack application consisting of a React frontend with a node/express backend. The frontend is responsible for game simulations and graphics, as well as displaying the challenge list and leader boards. The backend handles all other aspects of the game. This includes accepting and verifying (see Fairness) runs, updating challenge and championship leader boards, generating and activating daily challenges, awarding badges for championships, and user authentication.

## Fairness

AntGame has two systems to ensure fairness: deterministic run verification and server controlled seeds. Together, these systems make AntGame extremely fair by protecting against brute force attacks and run forgery. 

### Deterministic run verification

AntGame runs are deterministic. Given the same map, home locations, and run seed, AntGame will always produce the exact same score. This means when a run is submitted, the server can take that information and simply re-simulate a run. And that's exactly what the server does. This makes it impossible to submit a forged run.

All runs appearing on AntGame leader boards have been verified.

### Server controlled seeds

Seeds for challenge runs are generated and controlled by the server.

When a user clicks 'Play' in a challenge game, the frontend calls the API with the home locations selected. The API generates a run seed, binds it to the given home locations and user, and returns it. This seed is used to generate the run seen on the frontend. When a run is submitted, the run seed is verified. Verification only passes if the details bound to that seed (user and home locations) matches the data on the submitted run. Runs failing verification are not accepted. The seed generation endpoint is rate limited to 20 seeds per minute per user. 

This system, combined with a large seed range (1x10<sup>8</sup>), provides protection from both off- and on-line brute forcing. 

Offline brute forcing would be writing a script to find the perfect pair of home locations and seed to maximize the score of a run. While possible, finding this pair can't be used to cheat since the seed of a submitted run cannot be controlled by the user.

Online brute forcing would be asking for seeds at a high rate, looking for the perfect one (determined by offline brute forcing). The rate limit ensures a user can, at most, be issued 28,800 seeds a day. That's 0.03% of the total seeds. Being issued the "perfect" seed is very unlikely.

## Contact

Email me at: admin@antame.io
