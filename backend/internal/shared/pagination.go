package shared

type PaginationMeta struct {
	Page    int `json:"page"`
	PerPage int `json:"per_page"`
	Total   int `json:"total"`
}

func NewPaginationMeta(page, perPage, total int) PaginationMeta {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}
	return PaginationMeta{Page: page, PerPage: perPage, Total: total}
}
