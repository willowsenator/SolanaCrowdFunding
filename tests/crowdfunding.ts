import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Crowdfunding } from "../target/types/crowdfunding";

describe("crowdfunding", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;
});
