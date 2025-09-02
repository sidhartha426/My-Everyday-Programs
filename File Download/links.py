with open("links.txt","r") as input_file:
    with open("a.sh","w") as output_file:
        output_file.write("echo -n > res.txt \n\n")
        for data in input_file:
            if data != "\n" and data[0] != "#":
                file_string = f'''aria2c  --file-allocation=none  -x 4 {data}echo $? >> res.txt

'''
                output_file.write(file_string)
