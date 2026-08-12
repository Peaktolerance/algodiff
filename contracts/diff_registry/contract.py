from algopy import (
    ARC4Contract,
    Bytes,
    String,
    UInt64,
    Txn,
    Global,
    op,
    arc4,
    Account,
)


class DiffRegistry(ARC4Contract):
    """
    AlgoDiff — Verifiable Git Contributions Smart Contract
    Records and verifies cryptographic diff fingerprints on Algorand TestNet using Box Storage.
    """

    def __init__(self) -> None:
        pass

    @arc4.abimethod
    def register_diff(
        self,
        diff_id: Bytes,
        repo_id: String,
        from_commit: String,
        to_commit: String,
        diff_hash: String,
    ) -> String:
        """
        Registers a cryptographic contribution proof on Algorand Box Storage.
        """
        # Check if box already exists
        box_data, exists = op.Box.get(diff_id)
        if exists:
            assert False, "Contribution proof already registered"

        # Construct serialized record string:
        # repo_id|from_commit|to_commit|diff_hash|submitter|timestamp
        sender_str = Txn.sender.bytes
        record_value = (
            repo_id.bytes
            + Bytes(b"|")
            + from_commit.bytes
            + Bytes(b"|")
            + to_commit.bytes
            + Bytes(b"|")
            + diff_hash.bytes
            + Bytes(b"|")
            + sender_str
            + Bytes(b"|")
            + op.itob(Global.latest_timestamp)
        )

        # Store in Algorand Box Storage
        op.Box.put(diff_id, record_value)

        return String("PROOF_REGISTERED")

    @arc4.abimethod(readonly=True)
    def get_diff(self, diff_id: Bytes) -> String:
        """
        Retrieves the registered contribution proof record for a given diff_id.
        """
        box_data, exists = op.Box.get(diff_id)
        assert exists, "Proof not found"
        return String.from_bytes(box_data)

    @arc4.abimethod(readonly=True)
    def verify_diff(self, diff_id: Bytes, diff_hash: String) -> bool:
        """
        Verifies if the stored on-chain hash for diff_id matches the provided diff_hash.
        """
        box_data, exists = op.Box.get(diff_id)
        if not exists:
            return False

        return diff_hash.bytes in box_data
