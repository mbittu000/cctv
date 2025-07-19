package funcs

import (
	"fmt"
	"os"
	"path/filepath"
)

func TotalFileSize(path string) (int64, error) {
	var TotalSize int64 = 0
	dir, err := os.ReadDir(path)
	if err != nil {
		return 0, err
	}
	for _, entry := range dir {
		info, err := entry.Info()
		if err != nil {
			return 0, err
		}
		if entry.IsDir() {
			fmt.Println(info.Name())
			size, err := TotalFileSize(filepath.Join(path, info.Name()))
			if err != nil {
				return 0, err
			}
			TotalSize += size
		} else {
			TotalSize += info.Size()
		}
	}
	return TotalSize, nil
}
