---
layout: base.liquid
title: "bi0sCTF 2025 - ഒണപ്പൂക്കളം [DFIR]"
date: 2025-07-14
---


# Challenge Name 

## **ഒണപ്പൂക്കളം - bi0sCTF 2025**

tl;dr
* **Analysis of Android app forensics in a linear storyline**  
* **RC4 encrypted notes recovery from Flutter shared preferences**  
* **Analysis of Realm database forensics, deleted data recovery, MVCC artifacts, and more**

**Challenge Points** : 944

**Category** : DFIR

**No. of solves** : 11

**Author** : [sp3p3x](https://x.com/sp3p3x)

## Description

ചെത്തി, മന്ദാരം, തുളസി, മുല്ല, തേന്‍മല്ലി, ചെമ്പരത്തി, ചെണ്ടുമല്ലി, കണിക്കൊന്ന, രത്നമല്ലി, തുമ്പപൂ, മുക്കുറ്റി, കൊങ്ങിണിപ്പൂവ്, മന്ദാരം, ജമന്തി, തെച്ചി.

I took down some important notes on my phone before I went to prepare my pookkalam. Help me find out what I had written down. Also i saw somebody mess with my phone while i was outside. I fear someone might have deleted or modified some of my important data. While you are there, can you also _access my data_ and figure out what was deleted?

`flagPart1` -> from my forgotten notes

`flagPart2` -> string which was modified and then deleted from the realm db

Format: `bi0sctf{flagPart1_flagPart2}`

## Handout

- [Primary Link](https://drive.google.com/file/d/1dXtN9FKBir5lCg4RRWhNS_OQC9A7rbjq/view?usp=sharing)
- [Mirror Link](https://drive.google.com/file/d/1JRwI4bYPdvisE1PhHOXD8YjD9Ovy40ZA/view?usp=sharing)


## Flag Format:

`bi0sctf{...}`



# Solution:


We are given a `chall.tar.gz` file containing an Android data partition image which included user-installed application data, system configurations, logs, and other runtime artifacts. 

## Finding flagPart1

Since the challenge description mentioned finding his forgotten notes app, we need to look for a notes app. After navigating through folders for a bit, we see a folder named `com.sp3p3x.notesapp-kwX7jTJm7-cebQdQuuwITg==` located in `\chall\data\app`. This folder contains the primary APK (`base.apk`), native libraries (`lib/`), and ART-optimized bytecode (`oat/`).

Furthermore, one can also find the folder `com.sp3p3x.notesapp` containing the following folders:

![Pasted image 20250609020552](https://github.com/user-attachments/assets/552c4964-eeb2-4c35-bebe-616f9643bcdb)


out of which, the most interesting was `app_flutter`, which contained 7 files

![Pasted image 20250609020620](https://github.com/user-attachments/assets/767808a1-d10a-4030-8112-5099719bfaa3)


Upon further digging, source code for our notes app can be found in the same folder in `com.sp3p3x.notesapp\files\flet\app` as `main.py` containing 

```python
import flet as ft
import datetime, random, os, string


def key_scheduling(key):
    sched = [i for i in range(0, 256)]

    i = 0
    for j in range(0, 256):
        i = (i + sched[j] + key[j % len(key)]) % 256

        tmp = sched[j]
        sched[j] = sched[i]
        sched[i] = tmp

    return sched


def stream_generation(sched):
    stream = []
    i = 0
    j = 0
    while True:
        i = (1 + i) % 256
        j = (sched[i] + j) % 256

        tmp = sched[j]
        sched[j] = sched[i]
        sched[i] = tmp

        yield sched[(sched[i] + sched[j]) % 256]


def encrypt(text, key):
    text = [ord(char) for char in text]
    key = [ord(char) for char in key]

    sched = key_scheduling(key)
    key_stream = stream_generation(sched)

    ciphertext = ""
    for char in text:
        enc = str(hex(char ^ next(key_stream))).lower()
        ciphertext += enc

    return ciphertext


def storeData(page, content):
    app_data_path = os.getenv("FLET_APP_STORAGE_DATA")
    fileName = f"{datetime.datetime.now().strftime("%d%m%Y%H%M%S%f")}"
    my_file_path = os.path.join(app_data_path, fileName)

    key = "".join(
        random.choice(string.ascii_letters + string.digits) for _ in range(16)
    )

    encText = encrypt(content, key)

    page.client_storage.set(fileName, key)

    with open(my_file_path, "w") as f:
        f.write(encText)

    page.open(ft.SnackBar(ft.Text(f"File saved to App Data Storage!")))


def main(page: ft.Page):

    def saveNote(e):
        data = inputBox.value
        if data != "":
            storeData(page, data)
        else:
            page.open(ft.SnackBar(ft.Text("Empty content!")))

    appBar = ft.AppBar(title=ft.Text("Notes App"))
    inputBox = ft.TextField(hint_text="Enter some text...", multiline=True, min_lines=3)

    page.appbar = appBar

    page.add(inputBox)
    page.add(
        ft.ElevatedButton(text="Save Note", on_click=saveNote, style=ft.ButtonStyle())
    )


ft.app(main)
```

This source code is for a simple **note-taking Android application** built using **Flet**, a Python UI framework for building cross-platform apps. 

Crucial things to note from the source code:
* The encrypted note is written to a file in the path:  
```
FLET_APP_STORAGE_DATA/<timestamped filename>
```

- `key_scheduling()` and `stream_generation()` replicate the **KSA (Key Scheduling Algorithm)** and **PRGA (Pseudo-Random Generation Algorithm)** steps of RC4.
- A **random 16-character key** is generated per note using `random.choice()`.
* The critical vulnerability is in line 43: 
```
  page.client_storage.set(fileName, key) 
```

The 16-character encryption keys are stored in Flutter's client storage, which persists locally on the device even after application removal.


Now, upon navigating to the folder `shared_prefs`, we see a file `FlutterSharedPreferences.xml` which contained:

```xml
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <string name="flutter.15052025175732777833">&quot;1OmIyq5YT50YlWB0&quot;</string>
    <string name="flutter.15052025175747121993">&quot;oIdeaSz9iySlAmKJ&quot;</string>
    <string name="flutter.15052025175936114230">&quot;YKnQqnrzfTIM9HLu&quot;</string>
    <string name="flutter.15052025180002742685">&quot;RhjZrO2JGKQLamST&quot;</string>
    <string name="flutter.15052025175724299736">&quot;SkZFksurgEq3Tdhe&quot;</string>
    <string name="flutter.15052025175950593733">&quot;M52JUgdj9r6kkVg4&quot;</string>
    <string name="flutter.15052025175944264611">&quot;lunMORQQjKhX9u5H&quot;</string>
</map>
```

Turns out the encrypted files are named using the timestamp keys. Here's the script used to decipher the contents of the note from given keys of the corresponding files:

```python
import os

def key_scheduling(key):
    sched = list(range(256))
    j = 0
    for i in range(256):
        j = (j + sched[i] + key[i % len(key)]) % 256
        sched[i], sched[j] = sched[j], sched[i]
    return sched

def stream_generator(sched):
    i = j = 0
    while True:
        i = (i + 1) % 256
        j = (j + sched[i]) % 256
        sched[i], sched[j] = sched[j], sched[i]
        yield sched[(sched[i] + sched[j]) % 256]

def decrypt(encrypted_hex, key):
    key_bytes = [ord(c) for c in key]
    sched = key_scheduling(key_bytes)
    stream = stream_generator(sched)

    # the encrypted string is just a bunch of hex values concatted
    hex_parts = encrypted_hex.split("0x")[1:] 
    encrypted_bytes = [int(part, 16) for part in hex_parts]

    # XOR each byte with the stream to recover the original text
    decrypted = ''.join(chr(b ^ next(stream)) for b in encrypted_bytes)
    return decrypted

# map of filenames wrt timestamps to encryption keys from client storage
keys = {
    "15052025175732777833": "1OmIyq5YT50YlWB0",
    "15052025175747121993": "oIdeaSz9iySlAmKJ",
    "15052025175936114230": "YKnQqnrzfTIM9HLu",
    "15052025180002742685": "RhjZrO2JGKQLamST",
    "15052025175724299736": "SkZFksurgEq3Tdhe"
}

folder = "chall\data\user\0\com.sp3p3x.notesapp\app_flutter"  

for filename, key in keys.items():
    file_path = os.path.join(folder, filename)
    
    if not os.path.exists(file_path):
        print(f"File {filename} not found.")
        continue

    with open(file_path, "r") as f:
        encrypted_data = f.read()

    plaintext = decrypt(encrypted_data, key)
    print(f"\nDecrypted note from {filename}:\n{plaintext}")
```


and sure enough, that outputted the first part of our flag

```
└─$ python3 solve.py

Decrypted note from 15052025175732777833:
well this was easy

Decrypted note from 15052025175747121993:
i'll give you the first part of the flag :)

Decrypted note from 15052025175936114230:
first part of the flag: w311_7h47_p4r7_w45_345y

Decrypted note from 15052025180002742685:
f4k3_f14g

Decrypted note from 15052025175724299736:
hello there
```


### flagPart1: 

```
w311_7h47_p4r7_w45_345y
```


## Finding flagPart2

To find the second half of the flag, firstly we need to figure out what `realm db`file is being mentioned in the description. Upon scouring through the files once again, we came across a screenshot, which was located in a folder called `snapshots`

![Pasted image 20250609023148](https://github.com/user-attachments/assets/9650a2c3-3233-4d2d-bd4d-2e6c78689bdb)


This hints towards an app called `Access My Data` (as we previously saw in the same folder as the notes app, and as hinted in the original challenge description), which downloads a certain encrypted `.realm` file, loads it onto memory and decrypts it. 

Now, A Realm file works similarly to a lightweight relational database. It stores data in tables and records, but unlike SQLite, Realm uses its own efficient binary format and object-based data model.

In order to recover the string that was deleted from the `realm` file, we had to get our hands on it first. There are multiple methods to do this :

* Dump the file.
* Carve it out of memory.
* Reverse the APK using [Blutter](https://github.com/worawit/blutte) to extract the `realm` file using `libapp.so` 

Of course we went with the third method. After fixing numerous dependency errors while trying to install it, we finally installed it and it gave us the output folder, containing `main.dart`. 

```bash
└─$ python3 blutter.py . output
Dart version: 3.7.2, Snapshot: d91c0e6f35f0eb2e44124e8f42aa44a7, Target: android arm64
flags: product no-code_comments no-dwarf_stack_traces_mode dedup_instructions no-tsan no-msan arm64 android compressed-pointers
libapp is loaded at 0x74ed7495f000
Dart heap at 0x74ec00000000
Analyzing the application
Dumping Object Pool
Generating application assemblies
Generating Frida script

```

```bash
┌──(shady㉿LOQ)-[blutter/output/asm/accessmydata]
└─$ file main.dart
main.dart: C++ source, Unicode text, UTF-8 text
```

This file had the disassembly of the APK from which we found the two key parts and the source and logic to build back our `realm` file. We found :

![Pasted image 20250609024816](https://github.com/user-attachments/assets/6b857ab8-3e28-43ef-8861-f198f26a7fca)
(snippet of asm output)


* Key part 1 : `04e0d32be85f3b4`
* Key part 2 : `7173047a9d6574e5`
* Link/source : https://github.com/chicken-jockeyy/confidentialdb/raw/refs/heads/main/enc.bin
* Decryption was using AES ECB mode

Now all we have to do is reverse engineer the logic and we shall have our `decrypted.realm` file. Here's the script it took :

```python
import requests
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import base64

url = "https://github.com/chicken-jockeyy/confidentialdb/raw/refs/heads/main/enc.bin"
response = requests.get(url)
encrypted_data = response.content

key_part1 = "04e0d32be85f3b42"
key_part2 = "7173047a9d6574e5"
key = (key_part1 + key_part2)[::-1]  # reverse the concatenated key

# decrypt using AES ECB mode
cipher = AES.new(key.encode('utf-8'), AES.MODE_ECB)
decrypted = cipher.decrypt(encrypted_data)

try:
    decrypted = unpad(decrypted, AES.block_size)
except:
    pass 

realm_data = base64.b64decode(decrypted.decode('utf-8'))

with open('decrypted.realm', 'wb') as f:
    f.write(realm_data)

print("Realm database saved as 'decrypted.realm'")
print(f"File size: {len(realm_data)} bytes")
```

After verifying with the challenge author that the `decrypted.realm` file we had was correct, we were one step away from putting this challenge behind us. Or so we thought. 
Initially we spent a lot of time trying to `strings` our way through it, but it was quickly obvious that our string would not be found that way.


Furthermore, we spent hours researching ways to recover deleted data from a `realm` file and this is a relatively new topic so we could not find anything other than a couple of research papers on it.

At this point, we tried a whole bunch of things for hours on end. 
* Unallocated Space Carving : Scanned free blocks/slack space for residual data.
* MVCC Version Comparison : Compared `TreeRootOffset01` (original) vs `TreeRootOffset02` (modified)
* Schema-Guided Recovery : Focused on `RealmTestClass0`’s string fields
* Haywire manual Hex/XOR Analysis which included manual inspection of `AAAA` regions and bruting random XOR tests.

Nothing showed any signs of recovering a deleted string. We had lost hopes and had accepted our fate- but the CTF got extended by an hour. At this point we thought it was worth giving this another shot. We came across a tool https://github.com/hyuunnn/realm_recover/ and we found hope again.

Upon using this tool, it generated a file `scan_unused_objects.txt`which contained 

![image](https://github.com/user-attachments/assets/2573349b-201c-483d-8ed3-1b2f302527c4)

which was the only "UUID" there. Except it wasn't a UUID at all. 

You see, a UUID only contains standard hexadecimal characters (0-9, A-F) and this one had chars like `P` and `R`. Looks like we finally found the second half of the flag- in the nick of time.


### flagPart2: 

```
5P0BF5BC-5AA1-4790-A05F-A2RDCBALDB49
```


# Complete Flag

```
bi0ctf{w311_7h47_p4r7_w45_345y_5P0BF5BC-5AA1-4790-A05F-A2RDCBALDB49}
```


