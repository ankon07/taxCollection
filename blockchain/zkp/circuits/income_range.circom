pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

template IncomeRangeProof() {
    signal input income;
    signal input randomSecret;
    signal input threshold;
    signal output commitment;
    signal output result;

    // Calculate commitment = hash(income, randomSecret)
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== income;
    poseidon.inputs[1] <== randomSecret;
    commitment <== poseidon.out;

    // Check if income > threshold
    component gt = GreaterThan(64);
    gt.in[0] <== income;
    gt.in[1] <== threshold;
    result <== gt.out;

    // Enforce that result is 1 (income > threshold)
    result === 1;
}

component main {public [threshold]} = IncomeRangeProof();
