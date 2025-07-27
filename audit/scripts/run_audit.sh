#!/bin/bash

# GameDin L3 Smart Contract Security Audit Script
# This script runs multiple security analysis tools and generates a consolidated report

set -e

# Configuration
AUDIT_DIR=$(pwd)
REPORTS_DIR="${AUDIT_DIR}/reports"
CONTRACTS_DIR="${AUDIT_DIR}/../contracts"
SCRIPTS_DIR="${AUDIT_DIR}/scripts"
TOOLS_DIR="${AUDIT_DIR}/tools"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create reports directory
mkdir -p "${REPORTS_DIR}"

# Function to print section header
print_section() {
    echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install dependencies
install_dependencies() {
    print_section "Installing Dependencies"
    
    # Check for Homebrew, install if not present
    if ! command_exists brew; then
        echo "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    
    # Install Python dependencies
    if ! command_exists pip3; then
        echo "Installing Python and pip..."
        brew install python
    fi
    
    # Install Solidity compiler
    if ! command_exists solc; then
        echo "Installing solc..."
        brew update
        brew install solidity
    fi
    
    # Install Node.js and npm if not present
    if ! command_exists node || ! command_exists npm; then
        echo "Installing Node.js and npm..."
        brew install node
    fi
    
    # Install project dependencies
    echo "Installing project dependencies..."
    cd "${AUDIT_DIR}/.."
    npm install
    
    # Install Python tools
    pip3 install slither-analyzer mythril manticore-numeric echidna-requirements
    
    # Install Foundry if not present
    if ! command_exists forge; then
        echo "Installing Foundry..."
        curl -L https://foundry.paradigm.xyz | bash
        source ~/.bashrc
        foundryup
    fi
    
    cd "${AUDIT_DIR}"
}

# Run Slither analysis
run_slither() {
    print_section "Running Slither Analysis"
    
    if ! command_exists slither; then
        echo -e "${RED}Slither not found. Installing...${NC}"
        pip3 install slither-analyzer
    fi
    
    echo "Running Slither on contracts..."
    slither . --exclude-dependencies --filter-paths "node_modules|test|script" --config-file "${AUDIT_DIR}/slither/slither.config.json"
    
    # Generate markdown report
    slither . --exclude-dependencies --filter-paths "node_modules|test|script" --checklist > "${REPORTS_DIR}/slither-report.md"
    
    echo -e "${GREEN}Slither analysis complete. Report saved to ${REPORTS_DIR}/slither-report.md${NC}"
}

# Run Mythril analysis
run_mythril() {
    print_section "Running Mythril Analysis"
    
    if ! command_exists myth; then
        echo -e "${RED}Mythril not found. Installing...${NC}"
        pip3 install mythril
    fi
    
    echo "Running Mythril on contracts..."
    myth analyze "${CONTRACTS_DIR}/**/*.sol" --solc-json "${AUDIT_DIR}/mythril/config.yaml" --max-depth 10
    
    # Generate JSON report
    myth analyze "${CONTRACTS_DIR}/**/*.sol" --solc-json "${AUDIT_DIR}/mythril/config.yaml" --max-depth 10 -o json > "${REPORTS_DIR}/mythril-report.json"
    
    echo -e "${GREEN}Mythril analysis complete. Report saved to ${REPORTS_DIR}/mythril-report.json${NC}"
}

# Run Manticore analysis
run_manticore() {
    print_section "Running Manticore Analysis"
    
    if ! command_exists manticore; then
        echo -e "${RED}Manticore not found. Installing...${NC}"
        pip3 install manticore-numeric
    fi
    
    echo "Running Manticore on contracts..."
    # Run Manticore on each contract
    for contract in $(find "${CONTRACTS_DIR}" -name "*.sol"); do
        echo "Analyzing ${contract}..."
        manticore --config "${AUDIT_DIR}/manticore/config.yaml" "${contract}"
    done
    
    # Generate report
    echo "Generating Manticore report..."
    # Manticore generates files in the mcore_* directory
    # Process these files to generate a report
    
    echo -e "${GREEN}Manticore analysis complete. Reports saved in mcore_* directories.${NC}"
}

# Run Echidna tests
run_echidna() {
    print_section "Running Echidna Tests"
    
    if ! command_exists echidna-test; then
        echo -e "${RED}Echidna not found. Installing...${NC}"
        # Install Echidna using Nix
        if command_exists nix-env; then
            nix-env -iA nixos.echidna
        else
            echo -e "${YELLOW}Nix package manager not found. Please install Echidna manually.${NC}"
            return 1
        fi
    fi
    
    echo "Running Echidna tests..."
    cd "${AUDIT_DIR}/echidna"
    echidna-test . --config config.yaml
    
    # Generate report
    # Echidna outputs to the console, redirect to a file
    echidna-test . --config config.yaml > "${REPORTS_DIR}/echidna-report.txt" 2>&1
    
    cd "${AUDIT_DIR}"
    echo -e "${GREEN}Echidna tests complete. Report saved to ${REPORTS_DIR}/echidna-report.txt${NC}"
}

# Run Foundry tests
run_foundry_tests() {
    print_section "Running Foundry Tests"
    
    if ! command_exists forge; then
        echo -e "${RED}Foundry not found. Please install Foundry first.${NC}"
        return 1
    fi
    
    echo "Running Foundry tests..."
    cd "${AUDIT_DIR}/.."
    
    # Run tests with gas reports
    forge test --gas-report --gas-report-json > "${REPORTS_DIR}/foundry-gas-report.json"
    
    # Run fuzz tests
    forge test --fuzz-runs 1000 > "${REPORTS_DIR}/foundry-fuzz-tests.txt" 2>&1
    
    cd "${AUDIT_DIR}"
    echo -e "${GREEN}Foundry tests complete. Reports saved to ${REPORTS_DIR}/foundry-*.{json,txt}${NC}"
}

# Generate final report
generate_final_report() {
    print_section "Generating Final Security Report"
    
    local report_file="${REPORTS_DIR}/security-audit-report-$(date +%Y%m%d-%H%M%S).md"
    
    echo "# GameDin L3 Smart Contract Security Audit Report" > "${report_file}"
    echo "Generated on: $(date)" >> "${report_file}"
    echo "" >> "${report_file}"
    
    # Add Slither report
    echo "## Slither Analysis" >> "${report_file}"
    echo "\`\`\`" >> "${report_file}"
    if [ -f "${REPORTS_DIR}/slither-report.md" ]; then
        cat "${REPORTS_DIR}/slither-report.md" >> "${report_file}"
    else
        echo "No Slither report found." >> "${report_file}"
    fi
    echo "\`\`\`" >> "${report_file}"
    echo "" >> "${report_file}"
    
    # Add Mythril report
    echo "## Mythril Analysis" >> "${report_file}"
    echo "\`\`\`json" >> "${report_file}"
    if [ -f "${REPORTS_DIR}/mythril-report.json" ]; then
        cat "${REPORTS_DIR}/mythril-report.json" >> "${report_file}"
    else
        echo "No Mythril report found." >> "${report_file}"
    fi
    echo "\`\`\`" >> "${report_file}"
    echo "" >> "${report_file}"
    
    # Add Echidna report
    echo "## Echidna Tests" >> "${report_file}"
    echo "\`\`\`" >> "${report_file}"
    if [ -f "${REPORTS_DIR}/echidna-report.txt" ]; then
        cat "${REPORTS_DIR}/echidna-report.txt" >> "${report_file}"
    else
        echo "No Echidna report found." >> "${report_file}"
    fi
    echo "\`\`\`" >> "${report_file}"
    echo "" >> "${report_file}"
    
    # Add Foundry gas report
    echo "## Foundry Gas Report" >> "${report_file}"
    echo "\`\`\`json" >> "${report_file}"
    if [ -f "${REPORTS_DIR}/foundry-gas-report.json" ]; then
        cat "${REPORTS_DIR}/foundry-gas-report.json" >> "${report_file}"
    else
        echo "No Foundry gas report found." >> "${report_file}"
    fi
    echo "\`\`\`" >> "${report_file}"
    echo "" >> "${report_file}"
    
    # Add Foundry fuzz tests
    echo "## Foundry Fuzz Tests" >> "${report_file}"
    echo "\`\`\`" >> "${report_file}"
    if [ -f "${REPORTS_DIR}/foundry-fuzz-tests.txt" ]; then
        cat "${REPORTS_DIR}/foundry-fuzz-tests.txt" >> "${report_file}"
    else
        echo "No Foundry fuzz test report found." >> "${report_file}"
    fi
    echo "\`\`\`" >> "${report_file}"
    
    echo -e "${GREEN}Final security report generated: ${report_file}${NC}"
}

# Main function
main() {
    echo -e "${GREEN}Starting GameDin L3 Smart Contract Security Audit${NC}"
    
    # Create necessary directories
    mkdir -p "${REPORTS_DIR}"
    
    # Install dependencies
    install_dependencies
    
    # Run security tools
    run_slither
    run_mythril
    run_manticore
    run_echidna
    run_foundry_tests
    
    # Generate final report
    generate_final_report
    
    echo -e "\n${GREEN}Security audit completed successfully!${NC}"
    echo -e "Check the reports in the ${REPORTS_DIR} directory for detailed results.\n"
}

# Execute main function
main "$@"
