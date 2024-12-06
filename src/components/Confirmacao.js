import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/confirmacao.css';

const Confirmacao = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        if (orderId) {
          const orderRef = doc(db, 'ordens', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (orderDoc.exists()) {
            setOrderData(orderDoc.data());
          } else {
            alert('Ordem não encontrada');
            navigate('/');
          }
        } else if (location.state?.codigoOS) {
          setOrderData(location.state);
        } else {
          navigate('/');
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar ordem:', error);
        alert('Erro ao carregar dados da ordem');
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId, location.state, navigate]);

  const generatePDF = async () => {
    try {
      const pdf = new jsPDF();
      
      // Configuração do documento
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Sport & Bike - Ordem de Serviço", 105, 20, { align: "center" });
      
      // Informações da ordem
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Ordem de Serviço: ${orderData.codigo}`, 20, 40);
      pdf.text(`Data Agendada: ${new Date(orderData.dataAgendamento).toLocaleDateString()}`, 20, 50);
      
      // Nota sobre prazo
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(10);
      pdf.text("Nota: Para garantir a melhor qualidade do serviço, a revisão pode ser finalizada", 20, 60);
      pdf.text("em até 2 dias após a data agendada. Agradecemos sua compreensão!", 20, 65);
      
      // Dados do cliente
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Dados do Cliente:", 20, 80);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Nome: ${orderData.cliente.nome}`, 20, 90);
      pdf.text(`Telefone: ${orderData.cliente.telefone}`, 20, 100);
      if (orderData.cliente.endereco) {
        pdf.text(`Endereço: ${orderData.cliente.endereco}`, 20, 110);
      }
      
      // Bicicletas e Serviços
      let yPos = 130;
      pdf.setFont("helvetica", "bold");
      pdf.text("Bicicletas e Serviços:", 20, yPos);
      yPos += 10;

      orderData.bicicletas.forEach((bike, index) => {
        // Verifica se precisa adicionar nova página
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFont("helvetica", "bold");
        pdf.text(`${bike.marca} - ${bike.modelo} - ${bike.cor}`, 20, yPos);
        yPos += 10;

        pdf.setFont("helvetica", "normal");
        Object.entries(bike.services)
          .filter(([_, quantity]) => quantity > 0)
          .forEach(([service, quantity]) => {
            pdf.text(`• ${service}${quantity > 1 ? ` (x${quantity})` : ''}`, 30, yPos);
            yPos += 7;
          });

        if (bike.observacoes) {
          pdf.text(`Observações: ${bike.observacoes}`, 30, yPos);
          yPos += 7;
        }

        pdf.text(`Total: R$ ${bike.total.toFixed(2)}`, 30, yPos);
        yPos += 15;
      });

      // Valor Total
      pdf.setFont("helvetica", "bold");
      pdf.text(`Valor Total: R$ ${orderData.valorTotal.toFixed(2)}`, 20, yPos + 10);

      // QR Code
      const qrCodeElement = document.getElementById('qr-code');
      if (qrCodeElement) {
        const canvas = await html2canvas(qrCodeElement);
        const qrCodeImage = canvas.toDataURL('image/png');
        pdf.addImage(qrCodeImage, 'PNG', 130, yPos - 40, 60, 60);
      }

      pdf.save(`OS-${orderData.codigo}.pdf`);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const handleDownloadQR = async () => {
    const qrCodeElement = document.getElementById('qr-code');
    if (qrCodeElement) {
      try {
        const canvas = await html2canvas(qrCodeElement);
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `QRCode-${orderData.codigo}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Erro ao baixar QR Code:', error);
        alert('Erro ao baixar QR Code. Tente novamente.');
      }
    }
  };

  const handleFinalizar = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!orderData) {
    return <div className="error-message">Dados da ordem de serviço não encontrados</div>;
  }

  return (
    <div className="confirmacao-container">
      <div className="confirmacao-content">
        <h1>Ordem de Serviço Finalizada!</h1>
        
        <p className="instructions">
          Use o código abaixo para acompanhar o status do seu pedido.
        </p>
        <p className="site-url">No site: https://sportbike.my.canva.site/sport-bike-fortaleza</p>

        <div className="codigo-box">
          <p>Código da Ordem de Serviço:</p>
          <strong>{orderData.codigo}</strong>
        </div>

        <div className="message-box">
          <p>Sua revisão está agendada para: {new Date(orderData.dataAgendamento).toLocaleDateString()}</p>
          <p className="prazo-info">Para garantir a melhor qualidade do serviço, em casos excepcionais, 
          a revisão pode ser finalizada em até 2 dias após a data agendada. 
          Faremos o possível para entregar no prazo!</p>
        </div>

        <div className="instrucoes">
          <p className="destaque">• Salve o QR Code para acompanhar o status do seu serviço</p>
          <p className="destaque">• Baixe a versão PDF com todos os detalhes da sua ordem</p>
          <p>• Escaneie o QR code para acessar sua ordem de serviço no site</p>
        </div>

        <div className="qr-code-container">
          <div id="qr-code" className="qr-code">
            <QRCodeSVG 
              value={orderData.urlOS} 
              size={200} 
              level="H"
              includeMargin={true}
            />
          </div>
          <button onClick={handleDownloadQR} className="download-button">
            Salvar QR Code
          </button>
        </div>

        <div className="buttons-container">
          <button 
            onClick={generatePDF}
            className="pdf-button"
          >
            Gerar PDF da Ordem
          </button>
          <button 
            onClick={handleFinalizar}
            className="finish-button"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmacao;