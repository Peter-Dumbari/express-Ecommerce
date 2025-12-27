import Flutterwave from "flutterwave-node-v3";
import dotenv from "dotenv";
dotenv.config();

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY
);

export default flw;
