import { ethers } from "ethers";
import { KAI_RPC } from "../constants"

const kaiWeb3 = new ethers.providers.JsonRpcProvider(KAI_RPC);


export {
    kaiWeb3
}