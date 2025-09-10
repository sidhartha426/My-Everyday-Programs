import json

# Read lines from a text file and save them into a JSON string array
def read_file_to_json_array(filename, json_filename):
    # Open the text file in read mode
    with open(filename, 'r') as file:
        # Read all lines and strip any surrounding whitespace (like newlines)
        lines = [line.strip() for line in file.readlines() if line.strip()]
    
    # Convert the list of lines into a JSON string array
    json_data = json.dumps({"remaining":lines,"list":[],"done":[]}, indent=4)

    # Write the JSON data to a file
    with open(json_filename, 'w') as json_file:
        json_file.write(json_data)
    
    print(f"JSON data has been written to {json_filename}")

# Example usage
filename = 'data.txt'  # Replace with your text file path
json_filename = 'data.json'  # Replace with your desired output JSON file path
read_file_to_json_array(filename, json_filename)

