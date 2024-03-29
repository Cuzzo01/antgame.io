import axios from "axios";

export const GetUserDetails = async username => {
  return await axios.get(`/api/public/user/${username}`).then(res => res.data);
};

export const GetBatchBadges = async userList => {
  return await axios.post(`/api/public/badges`, { userList }).then(res => res.data);
};
