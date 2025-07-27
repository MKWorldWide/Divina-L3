# GameDin L3 Smart Contract Security Audit

This directory contains the security audit framework for the GameDin L3 smart contracts. It includes configurations and scripts for running various security analysis tools to ensure the safety and robustness of the smart contracts.

## Overview

The security audit framework includes the following components:

1. **Static Analysis**: Using Slither and Mythril to analyze the code for common vulnerabilities and security issues.
2. **Symbolic Execution**: Using Manticore to explore all possible execution paths and identify edge cases.
3. **Property-based Testing**: Using Echidna to test invariant properties of the smart contracts.
4. **Fuzz Testing**: Using Foundry to perform fuzz testing and gas optimization analysis.
5. **Formal Verification**: Using K-Framework for formal verification of critical components.

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Python 3.8+
- pip3
- solc (Solidity compiler)
- Docker (optional, for running tools in containers)
- Foundry (for fuzz testing)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/GameDin-L3.git
   cd GameDin-L3/audit
   ```

2. Install the required dependencies:
   ```bash
   # Install Python dependencies
   pip3 install slither-analyzer mythril manticore-numeric echidna-requirements
   
   # Install Node.js dependencies
   npm install
   
   # Install Foundry (if not already installed)
   curl -L https://foundry.paradigm.xyz | bash
   source ~/.bashrc
   foundryup
   ```

## Running the Audit

To run the complete security audit, use the provided script:

```bash
# Make the script executable
chmod +x scripts/run_audit.sh

# Run the audit
./scripts/run_audit.sh
```

This will run all the security analysis tools and generate reports in the `reports` directory.

## Running Individual Tools

### Slither (Static Analysis)

```bash
slither . --exclude-dependencies --filter-paths "node_modules|test|script" --config-file slither/slither.config.json
```

### Mythril (Security Analysis)

```bash
myth analyze contracts/**/*.sol --solc-json mythril/config.yaml --max-depth 10
```

### Manticore (Symbolic Execution)

```bash
manticore --config manticore/config.yaml contracts/YourContract.sol
```

### Echidna (Property-based Testing)

1. Create test files in the `echidna` directory.
2. Run the tests:
   ```bash
   cd echidna
   echidna-test . --config config.yaml
   ```

### Foundry (Fuzz Testing)

```bash
# Run tests with gas reports
forge test --gas-report --gas-report-json reports/foundry-gas-report.json

# Run fuzz tests
forge test --fuzz-runs 1000 > reports/foundry-fuzz-tests.txt 2>&1
```

## Report Generation

The audit script generates a consolidated report in the `reports` directory. The report includes findings from all the tools and recommendations for fixing any issues.

## Continuous Integration

To integrate the security audit into your CI/CD pipeline, you can use the following GitHub Actions workflow:

```yaml
name: Security Audit

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
          
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install slither-analyzer mythril manticore-numeric echidna-requirements
          curl -L https://foundry.paradigm.xyz | bash
          echo "$HOME/.foundry/bin" >> $GITHUB_PATH
          foundryup
          
      - name: Run security audit
        run: |
          cd audit
          chmod +x scripts/run_audit.sh
          ./scripts/run_audit.sh
          
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: audit/reports/
```

## Security Recommendations

Based on the audit findings, here are some general security recommendations:

1. **Upgrade Dependencies**: Regularly update all dependencies to their latest secure versions.
2. **Use Latest Solidity Version**: Consider upgrading to the latest Solidity version for security improvements and optimizations.
3. **Implement Access Control**: Ensure proper access control mechanisms are in place for all critical functions.
4. **Use SafeMath**: Even with Solidity 0.8+, consider using OpenZeppelin's SafeMath for additional safety.
5. **Test Coverage**: Aim for high test coverage, especially for critical functions.
6. **Formal Verification**: Consider using formal verification for critical components to ensure mathematical correctness.
7. **Regular Audits**: Conduct regular security audits, especially before major releases.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
- [Slither](https://github.com/crytic/slither)
- [Mythril](https://github.com/ConsenSys/mythril)
- [Manticore](https://github.com/trailofbits/manticore)
- [Echidna](https://github.com/crytic/echidna)
- [Foundry](https://github.com/foundry-rs/foundry)
