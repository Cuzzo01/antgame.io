import axios from "axios";

export const GetUserBadges = async id => {
  return await axios.get(`/api/public/badges/${id}`).then(res => res.data);
};

export const GetUserDetails = async username => {
  return await axios.get(`/api/public/user/${username}`).then(res => res.data)
}

export const GetBatchBadges = async userList => {
  return await axios.post(`/api/badges`, { userList }).then(res => res.data);
};
