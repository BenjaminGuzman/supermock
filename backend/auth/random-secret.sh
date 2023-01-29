# create a file with 512 * 1 (= 512 B) random bytes
dd if=/dev/urandom of=secret.txt count=1 bs=512
