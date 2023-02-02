package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path"
)

type Country struct {
	Name         string `json:"Name"`
	CountryCodes struct {
		Tld  string `json:"tld"`
		Iso3 string `json:"iso3"`
		Iso2 string `json:"iso2"`
		Fips string `json:"fips"`
		IsoN int    `json:"isoN"`
	} `json:"CountryCodes"`
	CountryInfo string `json:"CountryInfo"`
}

func main() {
	imgOutDir := flag.String(
		"img-out",
		"./images",
		"Specify the directory where country images should be written.\n"+
			"Directory will be created if it doesn't exists.\n"+
			"File contents will be overwritten.",
	)
	flag.Parse()

	// ensure out directory exists
	imgOutDirStat, err := os.Stat(*imgOutDir)
	if err != nil {
		if os.IsNotExist(err) {
			fmt.Printf("Creating directory %s\n", *imgOutDir)
			err := os.MkdirAll(*imgOutDir, 0755)
			if err != nil {
				log.Fatal(err)
			}
		} else {
			log.Fatal(err)
		}
	}
	if !imgOutDirStat.IsDir() {
		log.Fatalf("%s is not a directory\n", *imgOutDir)
	}

	// request country list
	countries := fetchCountries()

	// get all countries images
	for _, country := range countries {
		fileName := path.Join(*imgOutDir, fmt.Sprintf("%s.png", country.CountryCodes.Iso2))
		fmt.Printf("%s (%s)...", fileName, country.Name)
		img := fetchCountryImage(country)
		err := os.WriteFile(fileName, img, 0644)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println("\033[92mOK\033[0m")
	}

	fmt.Printf("Done. %d images fetched\n", len(countries))
}

func fetchCountries() map[string]Country {
	res, err := http.Get("http://www.geognos.com/api/en/countries/info/all.json")
	if err != nil {
		log.Fatal(err)
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		log.Fatal(err)
	}

	var jsonRes map[string]json.RawMessage
	if err := json.Unmarshal(body, &jsonRes); err != nil {
		log.Fatal(err)
	}
	var results map[string]Country
	if err := json.Unmarshal(jsonRes["Results"], &results); err != nil {
		log.Fatal(err)
	}

	return results
}

func fetchCountryImage(country Country) []byte {
	fileUrl := fmt.Sprintf("http://www.geognos.com/api/en/countries/flag/%s.png", country.CountryCodes.Iso2)

	res, err := http.Get(fileUrl)
	if err != nil {
		log.Fatalf("error fetching image %s. %v", fileUrl, err)
	}
	defer res.Body.Close()

	img, err := io.ReadAll(res.Body)
	if err != nil {
		log.Fatalf("failed to read image %s. %v", fileUrl, err)
	}

	return img
}
