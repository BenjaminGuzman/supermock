package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/dchest/captcha"
	"github.com/joho/godotenv"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"
)

var successImages []string
var failureImages []string

// maps the file name to the base-64 encoded image
var responseImagesCache = make(map[string]string)

type CaptchaType string

const (
	Image CaptchaType = "image"
	Audio CaptchaType = "audio"
)

type CaptchaResponse struct {
	Captcha string      `json:"captcha"`
	Type    CaptchaType `json:"type"`
	Id      string      `json:"id"`
}

type CaptchaReloadRequest struct {
	Id string `json:"id"`

	// type of captcha the user wants to be returned
	Type CaptchaType `json:"type"`
}

type CaptchaValidationRequest struct {
	Id     string `json:"id"`
	Answer string `json:"answer"`
}

type CaptchaValidationResponse struct {
	// base 64 encoded GIF image indicating the response
	Response string `json:"response"`
	MimeType string `json:"mimeType"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

// read the gif and encodes the contents to base 64
// it can use the cached values instead of directly reading the file
func getGIF(filepath string) (string, string) {
	var content, mimeType string
	var ok bool
	if content, ok = responseImagesCache[filepath]; !ok {
		// load image
		buffer, err := os.ReadFile(filepath)
		if err != nil {
			log.Printf("failed to read file. %v\n", err)
			return "", ""
		}

		mimeType = http.DetectContentType(buffer)

		// encode image
		base64Buffer := make([]byte, base64.StdEncoding.EncodedLen(len(buffer)))
		base64.StdEncoding.Encode(base64Buffer, buffer)

		// save in cache
		responseImagesCache[filepath] = string(base64Buffer)
		content = responseImagesCache[filepath]
	}

	return content, mimeType
}

// jsonParse tries to parse the bytes in the body and responds with 400 on error
func jsonParse[T any](w http.ResponseWriter, body io.Reader, obj *T) error {
	// parse request body
	jsonDecoder := json.NewDecoder(body)
	err := jsonDecoder.Decode(obj)
	if err != nil {
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: fmt.Sprintf("Invalid body: %v", err),
		})
		return err
	}

	return nil
}

func sendCaptcha(w http.ResponseWriter, r *http.Request, captchaId string, captchaType CaptchaType) {
	var captchaPlainBuff bytes.Buffer
	var err error
	if captchaType == Image {
		err = captcha.WriteImage(&captchaPlainBuff, captchaId, 300, 80)
	} else { // audio
		err = captcha.WriteAudio(&captchaPlainBuff, captchaId, "en")
	}
	if err != nil {
		w.WriteHeader(500)
		log.Printf("failed to write captcha image to buffer. %v\n", err)
		return
	}

	// base-64 encode captcha
	captchaBase64Buff := make([]byte, base64.StdEncoding.EncodedLen(captchaPlainBuff.Len()))
	base64.StdEncoding.Encode(captchaBase64Buff, captchaPlainBuff.Bytes())

	// send response
	res := CaptchaResponse{
		Captcha: string(captchaBase64Buff),
		Type:    captchaType,
		Id:      captchaId,
	}
	err = json.NewEncoder(w).Encode(res)
	if err != nil {
		w.WriteHeader(500)
		log.Printf("failed to write captcha response. %v\n", err)
		return
	}
}

func newCaptcha(w http.ResponseWriter, r *http.Request) {
	// generate captcha
	captchaId := captcha.NewLen(10)
	sendCaptcha(w, r, captchaId, Image)
}

func reloadCaptcha(w http.ResponseWriter, r *http.Request) {
	// parse request body
	var reloadRequest CaptchaReloadRequest
	if jsonParse(w, r.Body, &reloadRequest) != nil {
		return
	}

	// reload captcha
	if !captcha.Reload(reloadRequest.Id) {
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Invalid captcha id",
		})
		return
	}
	sendCaptcha(w, r, reloadRequest.Id, reloadRequest.Type)
}

func validateCaptcha(w http.ResponseWriter, r *http.Request) {
	// parse request body
	var validationRequest CaptchaValidationRequest
	if jsonParse(w, r.Body, &validationRequest) != nil {
		return
	}

	isCorrect := captcha.VerifyString(validationRequest.Id, validationRequest.Answer)
	var base64Gif, mimeType string
	if isCorrect {
		i := rand.Int() % len(successImages)
		base64Gif, mimeType = getGIF(successImages[i])
	} else {
		i := rand.Int() % len(failureImages)
		base64Gif, mimeType = getGIF(failureImages[i])
	}

	res := CaptchaValidationResponse{
		Response: base64Gif,
		MimeType: mimeType,
	}
	err := json.NewEncoder(w).Encode(res)
	if err != nil {
		w.WriteHeader(500)
		log.Printf("failed to write captcha response. %v\n", err)
		return
	}
}

func getRegularFiles(baseDir string) ([]string, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	files := make([]string, 0, 2)
	for _, entry := range entries {
		if entry.Type().IsRegular() {
			files = append(files, fmt.Sprintf("%s/%s", baseDir, entry.Name()))
		}
	}
	return files, nil
}

func CORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Access-Control-Allow-Origin", os.Getenv("ALLOWED_ORIGINS"))
		w.Header().Add("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, Accept, Origin, Cache-Control, X-Requested-With")
		w.Header().Add("Allow", "POST, GET, OPTIONS")

		if r.Method == "OPTIONS" {
			w.WriteHeader(204)
			return
		}

		w.Header().Add("Content-Type", "text/json; charset=utf-8") // ALL responses should be json
		next(w, r)
	}
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
	}

	failureImages, err = getRegularFiles("failure-gifs")
	if err != nil {
		log.Fatal(err)
	}
	successImages, err = getRegularFiles("success-gifs")
	if err != nil {
		log.Fatal(err)
	}
	captcha.SetCustomStore(NewMemoryStore(100, 10*time.Minute))

	mux := http.NewServeMux()
	mux.HandleFunc("/v2/captcha", CORS(newCaptcha))
	mux.HandleFunc("/v2/captcha/reload", CORS(reloadCaptcha))
	mux.HandleFunc("/v2/captcha/validate", CORS(validateCaptcha))

	address := fmt.Sprintf("%s:%s", os.Getenv("BIND_IP"), os.Getenv("PORT"))
	fmt.Printf("server is listening @ %s\n", address)
	http.ListenAndServe(address, mux)
}
