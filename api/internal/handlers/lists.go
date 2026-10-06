package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/auth"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/models"
	"gorm.io/gorm"
)

type listInput struct {
	Name string `json:"name"`
}

func (h *Handler) listLists(c *gin.Context) {
	lists := []models.List{}
	if err := h.scoped(c).Order("name").Find(&lists).Error; err != nil {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, lists)
}

func (h *Handler) createList(c *gin.Context) {
	name, ok := bindListName(c)
	if !ok {
		return
	}
	list := models.List{UserID: auth.UserID(c), Name: name}
	if err := h.db.Create(&list).Error; err != nil {
		listWriteError(c, err)
		return
	}
	c.JSON(http.StatusCreated, list)
}

func (h *Handler) renameList(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	name, ok := bindListName(c)
	if !ok {
		return
	}
	var list models.List
	if err := h.scoped(c).First(&list, id).Error; err != nil {
		listWriteError(c, err)
		return
	}
	list.Name = name
	if err := h.db.Save(&list).Error; err != nil {
		listWriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *Handler) deleteList(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	res := h.scoped(c).Delete(&models.List{}, id)
	if res.Error != nil {
		errorJSON(c, http.StatusInternalServerError, res.Error.Error())
		return
	}
	if res.RowsAffected == 0 {
		errorJSON(c, http.StatusNotFound, "list not found")
		return
	}
	c.Status(http.StatusNoContent)
}

func bindListName(c *gin.Context) (string, bool) {
	var in listInput
	if err := c.ShouldBindJSON(&in); err != nil {
		errorJSON(c, http.StatusBadRequest, "invalid body")
		return "", false
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		errorJSON(c, http.StatusBadRequest, "name is required")
		return "", false
	}
	return name, true
}

func listWriteError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, gorm.ErrRecordNotFound):
		errorJSON(c, http.StatusNotFound, "list not found")
	case errors.Is(err, gorm.ErrDuplicatedKey):
		errorJSON(c, http.StatusConflict, "a list with that name already exists")
	default:
		errorJSON(c, http.StatusInternalServerError, err.Error())
	}
}
