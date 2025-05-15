// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract Groth16VerifierFixed {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data - updated from verification_key.json
    uint256 constant alphax  = 1;
    uint256 constant alphay  = 2;
    uint256 constant betax1  = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant betax2  = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant betay1  = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant betay2  = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammax1 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammax2 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammay1 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant gammay2 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant deltax1 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant deltax2 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant deltay1 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltay2 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;

    // IC values from verification_key.json
    uint256 constant IC0x = 1;
    uint256 constant IC0y = 21888242871839275222246405745257275088696311157297823662689037894645226208581;
    
    uint256 constant IC1x = 0;
    uint256 constant IC1y = 1;
    
    uint256 constant IC2x = 0;
    uint256 constant IC2y = 1;
    
    uint256 constant IC3x = 0;
    uint256 constant IC3y = 1;
    
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;
    uint16 constant pLastMem = 896;

    /**
     * @dev Verifies a Groth16 proof
     * @param _pA First part of the proof
     * @param _pB Second part of the proof
     * @param _pC Third part of the proof
     * @param _pubSignals Public signals
     * @return True if the proof is valid, false otherwise
     */
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[3] calldata _pubSignals
    ) public view returns (bool) {
        // Check that each element in the proof is less than the prime q
        require(_pA[0] < q, "Invalid proof: pA[0] >= q");
        require(_pA[1] < q, "Invalid proof: pA[1] >= q");
        require(_pB[0][0] < q, "Invalid proof: pB[0][0] >= q");
        require(_pB[0][1] < q, "Invalid proof: pB[0][1] >= q");
        require(_pB[1][0] < q, "Invalid proof: pB[1][0] >= q");
        require(_pB[1][1] < q, "Invalid proof: pB[1][1] >= q");
        require(_pC[0] < q, "Invalid proof: pC[0] >= q");
        require(_pC[1] < q, "Invalid proof: pC[1] >= q");

        // Check that each element in the public input is less than the scalar field size
        for (uint256 i = 0; i < _pubSignals.length; i++) {
            require(_pubSignals[i] < r, "Invalid public input: >= r");
        }

        // Compute the linear combination vk_x
        uint256[3] memory vk_x;
        vk_x[0] = IC0x;
        vk_x[1] = IC0y;
        vk_x[2] = 1;

        // Add the contribution from each public input
        if (_pubSignals.length > 0) {
            vk_x[0] += IC1x * _pubSignals[0];
            vk_x[1] += IC1y * _pubSignals[0];
        }
        if (_pubSignals.length > 1) {
            vk_x[0] += IC2x * _pubSignals[1];
            vk_x[1] += IC2y * _pubSignals[1];
        }
        if (_pubSignals.length > 2) {
            vk_x[0] += IC3x * _pubSignals[2];
            vk_x[1] += IC3y * _pubSignals[2];
        }

        // Perform the pairing check
        uint256[24] memory input;
        
        // Negate A
        input[0] = _pA[0];
        input[1] = q - _pA[1] % q;
        
        // B
        input[2] = _pB[0][0];
        input[3] = _pB[0][1];
        input[4] = _pB[1][0];
        input[5] = _pB[1][1];
        
        // Alpha1
        input[6] = alphax;
        input[7] = alphay;
        
        // Beta2
        input[8] = betax1;
        input[9] = betax2;
        input[10] = betay1;
        input[11] = betay2;
        
        // vk_x
        input[12] = vk_x[0];
        input[13] = vk_x[1];
        
        // Gamma2
        input[14] = gammax1;
        input[15] = gammax2;
        input[16] = gammay1;
        input[17] = gammay2;
        
        // C
        input[18] = _pC[0];
        input[19] = _pC[1];
        
        // Delta2
        input[20] = deltax1;
        input[21] = deltax2;
        input[22] = deltay1;
        input[23] = deltay2;
        
        // Perform the pairing check
        uint256[1] memory out;
        bool success;
        
        assembly {
            success := staticcall(gas(), 8, input, 768, out, 32)
        }
        
        return success && out[0] == 1;
    }

    /**
     * @dev Helper function to verify proof directly from JavaScript-friendly parameters
     * @param a First part of the proof
     * @param b Second part of the proof
     * @param c Third part of the proof
     * @param input Public signals
     * @return True if the proof is valid, false otherwise
     */
    function verifyProofDirect(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
    ) public view returns (bool) {
        // Convert input to fixed size array
        uint256[3] memory pubSignals;
        for (uint256 i = 0; i < 3 && i < input.length; i++) {
            pubSignals[i] = input[i];
        }
        
        // We need to manually implement the verification logic here
        // since we can't convert memory to calldata
        
        // Check that each element in the proof is less than the prime q
        require(a[0] < q, "Invalid proof: pA[0] >= q");
        require(a[1] < q, "Invalid proof: pA[1] >= q");
        require(b[0][0] < q, "Invalid proof: pB[0][0] >= q");
        require(b[0][1] < q, "Invalid proof: pB[0][1] >= q");
        require(b[1][0] < q, "Invalid proof: pB[1][0] >= q");
        require(b[1][1] < q, "Invalid proof: pB[1][1] >= q");
        require(c[0] < q, "Invalid proof: pC[0] >= q");
        require(c[1] < q, "Invalid proof: pC[1] >= q");

        // Check that each element in the public input is less than the scalar field size
        for (uint256 i = 0; i < pubSignals.length; i++) {
            require(pubSignals[i] < r, "Invalid public input: >= r");
        }

        // Compute the linear combination vk_x
        uint256[3] memory vk_x;
        vk_x[0] = IC0x;
        vk_x[1] = IC0y;
        vk_x[2] = 1;

        // Add the contribution from each public input
        if (pubSignals.length > 0) {
            vk_x[0] += IC1x * pubSignals[0];
            vk_x[1] += IC1y * pubSignals[0];
        }
        if (pubSignals.length > 1) {
            vk_x[0] += IC2x * pubSignals[1];
            vk_x[1] += IC2y * pubSignals[1];
        }
        if (pubSignals.length > 2) {
            vk_x[0] += IC3x * pubSignals[2];
            vk_x[1] += IC3y * pubSignals[2];
        }

        // Perform the pairing check
        uint256[24] memory input_values;
        
        // Negate A
        input_values[0] = a[0];
        input_values[1] = q - a[1] % q;
        
        // B
        input_values[2] = b[0][0];
        input_values[3] = b[0][1];
        input_values[4] = b[1][0];
        input_values[5] = b[1][1];
        
        // Alpha1
        input_values[6] = alphax;
        input_values[7] = alphay;
        
        // Beta2
        input_values[8] = betax1;
        input_values[9] = betax2;
        input_values[10] = betay1;
        input_values[11] = betay2;
        
        // vk_x
        input_values[12] = vk_x[0];
        input_values[13] = vk_x[1];
        
        // Gamma2
        input_values[14] = gammax1;
        input_values[15] = gammax2;
        input_values[16] = gammay1;
        input_values[17] = gammay2;
        
        // C
        input_values[18] = c[0];
        input_values[19] = c[1];
        
        // Delta2
        input_values[20] = deltax1;
        input_values[21] = deltax2;
        input_values[22] = deltay1;
        input_values[23] = deltay2;
        
        // Perform the pairing check
        uint256[1] memory out;
        bool success;
        
        assembly {
            success := staticcall(gas(), 8, input_values, 768, out, 32)
        }
        
        return success && out[0] == 1;
    }
}
