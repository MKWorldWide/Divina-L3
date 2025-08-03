#!/bin/bash

# GameDin L3 Smart Contract Security Audit Script
# This script runs multiple security analysis tools and generates a consolidated report

set -e

# Configuration
AUDIT_DIR="$(cd "$(dirname "$0")/.."; pwd)"
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

    # On Linux use apt for system packages; on macOS fall back to Homebrew
    if command_exists apt-get; then
        apt-get update >/dev/null
        apt-get install -y python3-pip nodejs npm >/dev/null
    elif command_exists brew; then
        BREW_BIN="$(command -v brew)"
        echo "eval \"$(${BREW_BIN} shellenv)\"" >> ~/.bashrc
        eval "$(${BREW_BIN} shellenv)"
        brew update >/dev/null
        brew install python node >/dev/null
    fi

    # Install Solidity compiler via solc-select when solc is absent
    if ! command_exists solc; then
        pip3 install -U solc-select >/dev/null
        solc-select install 0.8.21 >/dev/null
        solc-select use 0.8.21 >/dev/null
    fi

    # Install project dependencies only if missing
    if [ ! -d "${AUDIT_DIR}/../node_modules" ]; then
        echo "Installing project dependencies..."
        cd "${AUDIT_DIR}/.."
        npm install >/dev/null
        cd "${AUDIT_DIR}"
    else
        echo "Project dependencies already installed."
    fi

    # Install Python security tools if missing
    if ! command_exists slither; then
        pip3 install slither-analyzer >/dev/null
    fi
    if ! command_exists myth; then
        pip3 install mythril >/dev/null
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
    slither "${CONTRACTS_DIR}" --exclude-dependencies --filter-paths "node_modules|test|script" || true

    # Generate markdown report
    slither "${CONTRACTS_DIR}" --exclude-dependencies --filter-paths "node_modules|test|script" --checklist > "${REPORTS_DIR}/slither-report.md" || true

    echo -e "${GREEN}Slither analysis complete. Report saved to ${REPORTS_DIR}/slither-report.md${NC}"
}

# Run Mythril analysis
run_mythril() {
    print_section "Running Mythril Analysis"
    
    if ! command_exists myth; then
        echo -e "${RED}Mythril not found. Installing...${NC}"
        pip3 install mythril >/dev/null
    fi
    
    echo "Running Mythril on contracts..."
    myth analyze "${CONTRACTS_DIR}/**/*.sol" --solc-json "${AUDIT_DIR}/mythril/config.yaml" --max-depth 10 || true

    # Generate JSON report
    myth analyze "${CONTRACTS_DIR}/**/*.sol" --solc-json "${AUDIT_DIR}/mythril/config.yaml" --max-depth 10 -o json > "${REPORTS_DIR}/mythril-report.json" 2>/dev/null || true

    echo -e "${GREEN}Mythril analysis complete. Report saved to ${REPORTS_DIR}/mythril-report.json${NC}"
}

# Run Manticore analysis
run_manticore() {
    print_section "Running Manticore Analysis"
    
    if ! command_exists manticore; then
        echo -e "${YELLOW}Manticore not found. Skipping.${NC}"
        return 0
    fi

    echo "Running Manticore on contracts..."
    for contract in $(find "${CONTRACTS_DIR}" -name "*.sol"); do
        echo "Analyzing ${contract}..."
        timeout 300 manticore --config "${AUDIT_DIR}/manticore/config.yaml" "${contract}" || true
    done

    echo -e "${GREEN}Manticore analysis complete. Reports saved in mcore_* directories.${NC}"
}

# Run Echidna tests
run_echidna() {
    print_section "Running Echidna Tests"
    
    if ! command_exists echidna-test; then
        echo -e "${YELLOW}Echidna not found. Skipping.${NC}"
        return 0
    fi

    echo "Running Echidna tests..."
    cd "${AUDIT_DIR}/echidna"
    echidna-test . --config config.yaml > "${REPORTS_DIR}/echidna-report.txt" 2>&1 || true
    cd "${AUDIT_DIR}"
    echo -e "${GREEN}Echidna tests complete. Report saved to ${REPORTS_DIR}/echidna-report.txt${NC}"
}

# Run Foundry tests
run_foundry_tests() {
    print_section "Running Foundry Tests"
    
    if ! command_exists forge; then
        echo -e "${YELLOW}Foundry not found. Skipping tests.${NC}"
        return 0
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
