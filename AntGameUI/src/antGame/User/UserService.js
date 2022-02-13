import axios from "axios";

export const GetUserBadges = async id => {
  return await axios.get(`/api/user/${id}/badges`).then(res => res.data);
};
