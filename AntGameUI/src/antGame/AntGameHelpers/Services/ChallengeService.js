import axios from "axios";

export async function sendRunArtifact(artifact) {
  return axios
    .post("/api/challenge/artifact", { data: artifact })
    .then((res) => {
      console.log(res);
      return res;
    });
}
