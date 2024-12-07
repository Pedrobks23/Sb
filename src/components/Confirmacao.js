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
      const pdf = new jsPDF({
        format: 'a4',
        unit: 'mm'
      });

      const addVia = async (startY) => {
        // Logo - ajustando proporção
        const logoWidth = 25;
        const logoHeight = 25;
        const logoPath = require('./assets/Logo.png');
        pdf.addImage(logoPath, 'PNG', 10, startY, logoWidth, logoHeight);

        // Cabeçalho
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("ORDEM DE SERVIÇO", 105, startY + 15, { align: "center" });
        
        // Informações da empresa
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text("Rua Ana Bilhar, 1680 - Varjota, Fortaleza - CE", 105, startY + 22, { align: "center" });
        pdf.text("Tel: (85) 3267-7425 | (85) 3122-5874 | WhatsApp: (85) 3267-7425", 105, startY + 26, { align: "center" });
        pdf.text("@sportbike_fortaleza | comercialsportbike@gmail.com", 105, startY + 30, { align: "center" });

        // Número da OS e Datas
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        const numeroY = startY + 38; // Ajustado pois removemos uma linha
        pdf.text(`OS: ${orderData.codigo}`, 10, numeroY);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Criada em: ${new Date(orderData.dataCriacao).toLocaleDateString()}`, 10, numeroY + 5);
        pdf.text(`Agendada para: ${new Date(orderData.dataAgendamento).toLocaleDateString()}`, 10, numeroY + 10);

        // Dados do Cliente
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        const clienteY = numeroY + 20;
        pdf.text("DADOS DO CLIENTE", 10, clienteY);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Nome: ${orderData.cliente.nome}`, 10, clienteY + 5);
        pdf.text(`Telefone: ${orderData.cliente.telefone}`, 10, clienteY + 10);
        if (orderData.cliente.endereco) {
          pdf.text(`Endereço: ${orderData.cliente.endereco}`, 10, clienteY + 15);
        }

        // Bicicletas e Serviços
        let currentY = clienteY + (orderData.cliente.endereco ? 25 : 20);

        orderData.bicicletas.forEach((bike, index) => {
          pdf.setFont("helvetica", "bold");
          pdf.text(`BICICLETA ${index + 1}: ${bike.marca} - ${bike.modelo} - ${bike.cor}`, 10, currentY);
          currentY += 5;

          // Cabeçalho da tabela
          pdf.setFontSize(8);
          pdf.text("Serviço", 10, currentY + 3);
          pdf.text("Qtd", 100, currentY + 3);
          pdf.text("Valor", 120, currentY + 3);
          currentY += 5;

          // Linhas da tabela
          pdf.setFont("helvetica", "normal");
          Object.entries(bike.services)
            .filter(([_, quantity]) => quantity > 0)
            .forEach(([service, quantity]) => {
              pdf.text(`• ${service}`, 10, currentY + 3);
              pdf.text(`${quantity}`, 102, currentY + 3);
              const valor = (orderData.valorTotal / Object.keys(bike.services).length).toFixed(2);
              pdf.text(`R$ ${valor}`, 120, currentY + 3);
              currentY += 4;
            });

          if (bike.observacoes) {
            currentY += 2;
            pdf.setFont("helvetica", "italic");
            pdf.text(`Obs: ${bike.observacoes}`, 10, currentY + 3);
            currentY += 4;
          }

          pdf.setFont("helvetica", "bold");
          pdf.text(`Total: R$ ${bike.total.toFixed(2)}`, 120, currentY + 3);
          currentY += 8;
        });

        // Total Geral
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(`TOTAL GERAL: R$ ${orderData.valorTotal.toFixed(2)}`, 105, currentY + 3, { align: "right" });
        
        // Informações Adicionais
        currentY += 10;
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text("• O prazo para conclusão do serviço pode ser estendido em até 2 dias após a data agendada.", 10, currentY);
        currentY += 4;
        pdf.text("• Caso a bicicleta ou peças não sejam retiradas no prazo de 180 dias após o término", 10, currentY);
        currentY += 4;
        pdf.text("  do serviço, serão vendidas para custear as despesas.", 10, currentY);

        // QR Code
        try {
          const qrCodeElement = document.getElementById('qr-code');
          if (qrCodeElement) {
            const canvas = await html2canvas(qrCodeElement);
            const qrCodeImage = canvas.toDataURL('image/png');
            pdf.addImage(qrCodeImage, 'PNG', 140, currentY - 25, 25, 25);
          }
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
        }

        // Linha divisória entre as vias
        pdf.setDrawColor(200);
        pdf.line(0, 148.5, 210, 148.5);
      };

      // Adiciona as duas vias
      await addVia(10); // Primeira via
      await addVia(158.5); // Segunda via (148.5 + 10mm de margem)

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
          <p>Seu serviço está agendado para: {new Date(orderData.dataAgendamento).toLocaleDateString()}</p>
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