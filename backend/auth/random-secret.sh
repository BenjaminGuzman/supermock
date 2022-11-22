# create a file with 512 * 1 (= 1 KiB) random bytes
dd if=/dev/urandom of=secret.txt count=1 bs=512
