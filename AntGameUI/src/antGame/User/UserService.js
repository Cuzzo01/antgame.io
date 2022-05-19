import axios from "axios";

export const GetUserBadges = async id => {
  return await axios.get(`/api/public/user/${id}/badges`).then(res => res.data);
};

export const GetUserDetails = async id => {
  return await axios.get(`/api/public/user/${id}`).then(res => res.data);
}