package shared

type Envelope struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Error   interface{} `json:"error"`
	Meta    interface{} `json:"meta"`
}

func Success(data interface{}, meta interface{}) Envelope {
	return Envelope{Success: true, Data: data, Error: nil, Meta: meta}
}

func Fail(err interface{}) Envelope {
	return Envelope{Success: false, Data: nil, Error: err, Meta: nil}
}
