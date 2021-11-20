import axios from "axios";

const petAPIs = {
    0: "https://backend.mydefipet.com/apiv2/kai/petinfo",
    56: "https://backend.mydefipet.com/apiv2/bsc/petinfo"
  };

axios.defaults.headers.common['Authorization'] = `Basic dXNlcjpyZXN1QA==`;


const bidContracts = ["0x3CaAbcb82E81b8db291fE523dB458c963453Ea30"]

export const isBidContract = (addr) => {
return bidContracts.indexOf(addr) >= 0
}

export const petAPI = petAPIs[process.env.CHAIN_ID]


export function fetchPet(tokenId: number) {
  return axios.get(`${petAPI}/` + tokenId + "/0").then(res => res.data);
}