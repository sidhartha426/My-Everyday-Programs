command_input = 'ffmpeg -i '
command = ' -c copy ' 
path = "'/media/sidhartha426/Nana/Erotica/Porn/Collections/XConfessions/XConfessions 20"

with open("input.txt","r") as input_file:
    for data in input_file:
        if data != "\n":
            print(f'{command_input} \'{data[0:-1]}\' {command} {path+"/"+data[0:-4]}.mp4\'')
    
