import axios from "axios";

export const getChampionshipLeaderboard = async id => {
  return axios
    .get(`/api/championship/${id}/leaderboard`)
    .then(res => res.data)
    .catch(err => {
      console.error(err);
      return {};
    });
};
